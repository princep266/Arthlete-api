import React, { useState } from "react";
import { View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import Ionicons from "react-native-vector-icons/Ionicons"; // Importing the plus icon

const API_KEY = "AIzaSyBBN40RwIPzX1R_lYj6DX6TqVeGN1rHyfk";

interface FoodData {
  name: string;
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
}

async function searchFood(query: string): Promise<FoodData[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Given the food query \"${query}\", provide nutritional information in strict JSON format:
                  [
                    {
                      \"name\": \"Food Name\",
                      \"calories\": number,
                      \"protein\": number,
                      \"fats\": number,
                      \"carbs\": number
                    }
                  ]
                  Return up to 5 relevant food items. Only return JSON, no extra text.`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) throw new Error("No valid data found in API response");

    const jsonStartIndex = textResponse.indexOf("[");
    const jsonEndIndex = textResponse.lastIndexOf("]") + 1;

    if (jsonStartIndex === -1 || jsonEndIndex === -1) throw new Error("Invalid JSON format");

    return JSON.parse(textResponse.slice(jsonStartIndex, jsonEndIndex));
  } catch (error) {
    console.error("Error fetching food data:", error);
    throw error;
  }
}

const FoodSearchScreen: React.FC = () => {
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<FoodData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [unit, setUnit] = useState("grams");

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a food name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await searchFood(query);
      setFoods(result);
      const initialQuantities = result.reduce((acc, item) => {
        acc[item.name] = 100; // Default quantity is 100g
        return acc;
      }, {} as { [key: string]: number });
      setQuantities(initialQuantities);
    } catch (err) {
      setError("Failed to fetch food data. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (foodName: string, change: number) => {
    setQuantities((prevQuantities) => {
      const newQuantity = Math.max(10, (prevQuantities[foodName] || 100) + change);
      return { ...prevQuantities, [foodName]: newQuantity };
    });
  };

  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit);
    setQuantities((prevQuantities) => {
      return Object.keys(prevQuantities).reduce((acc, key) => {
        acc[key] = newUnit === "grams" ? prevQuantities[key] : prevQuantities[key]; // Modify conversion if needed
        return acc;
      }, {} as { [key: string]: number });
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Food Nutrition Finder 🍏</Text>
      <TextInput
        style={styles.input}
        placeholder="Search food"
        placeholderTextColor="#aaa"
        value={query}
        onChangeText={setQuery}
      />
      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="large" color="#007BFF" />}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={foods}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => {
          const quantity = quantities[item.name] || 100;
          const factor = quantity / 100;

          return (
            <View style={styles.foodContainer}>
              <Text style={styles.foodName}>{item.name}</Text>
              <Text style={styles.calories}>🔥 {Math.round(item.calories * factor)} kcal - {quantity} {unit}</Text>

              <View style={styles.quantityContainer}>
                <TouchableOpacity onPress={() => handleQuantityChange(item.name, -10)} style={styles.quantityButton}>
                  <Text>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.quantityInput}
                  keyboardType="numeric"
                  value={quantity.toString()}
                  onChangeText={(value) => handleQuantityChange(item.name, Number(value) - quantity)}
                />
                <TouchableOpacity onPress={() => handleQuantityChange(item.name, 10)} style={styles.quantityButton}>
                  <Text>+</Text>
                </TouchableOpacity>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={unit}
                    style={styles.unitPicker}
                    dropdownIconColor="#000"
                    onValueChange={(itemValue) => handleUnitChange(itemValue)}
                    mode="dropdown"
                  >
                    <Picker.Item label="g" value="g" style={styles.pickerItem} />
                    <Picker.Item label="Milliliters (ml)" value="ml" style={styles.pickerItem} />
                  </Picker>
                </View>

                
                <TouchableOpacity style={styles.fab} onPress={() => console.log("Plus button pressed")}>
  <Text style={styles.fabText}>+</Text>
</TouchableOpacity>

                
              </View>

              <View style={styles.nutrientRow}>
                <View style={[styles.nutrientBox, { backgroundColor: "#d9f3fa", borderColor: "#2a9d8f" }]}>
                  <Text style={styles.nutrientValue}>{(item.protein * factor).toFixed(1)}g</Text>
                  <Text style={styles.nutrientLabel}>Protein</Text>
                </View>
                <View style={[styles.nutrientBox, { backgroundColor: "#fde4cf", borderColor: "#f4a261" }]}>
                  <Text style={styles.nutrientValue}>{(item.fats * factor).toFixed(1)}g</Text>
                  <Text style={styles.nutrientLabel}>Fats</Text>
                </View>
                <View style={[styles.nutrientBox, { backgroundColor: "#fff8d6", borderColor: "#e9c46a" }]}>
                  <Text style={styles.nutrientValue}>{(item.carbs * factor).toFixed(1)}g</Text>
                  <Text style={styles.nutrientLabel}>Carbs</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center" },
  input: { borderWidth: 1, padding: 10, marginVertical: 10, borderRadius: 5, borderColor: "#000" },
  searchButton: { backgroundColor: "#F6E1D3", padding: 10, borderRadius: 5, alignItems: "center" },
  searchButtonText: { color: "#E06714", fontWeight: "bold" },
  error: { color: "red", textAlign: "center", marginTop: 10 },
  foodContainer: { backgroundColor: "#fff", padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#ddd", marginVertical: 5 },
  foodName: { fontSize: 18, fontWeight: "bold" },
  calories: { fontSize: 16, color: "#555" },
  nutrientRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
  nutrientBox: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: "center", marginHorizontal: 5 },
  nutrientValue: { fontSize: 16, fontWeight: "bold" },
  nutrientLabel: { fontSize: 14, color: "#555" },
  quantityContainer: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  quantityButton: { padding: 10, borderWidth: 1, borderRadius: 5, marginHorizontal: 5 },
  quantityInput: { borderWidth: 1, padding: 10, borderRadius: 5, textAlign: "center", width: 60 },
  pickerContainer: {
    height: 45,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 5,
    width: 100, // Adjusted width to fit the text
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  unitPicker: {
    
    
    color: "#000", // Ensures text is visible
  },
  pickerItem: {
    
    color: "#000",
    fontSize: 15,
  },

  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#F6E1D3",
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    
    
    
  },
  fabText: {
    fontSize: 30,
    color: "#E06714",
    fontWeight: "bold",
  },
});

export default FoodSearchScreen;