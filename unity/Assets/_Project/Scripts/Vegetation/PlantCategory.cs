using System;

namespace WhisperingWilds.Vegetation
{
    public enum PlantCategory
    {
        Crop,       // Rice paddy, sugarcane, turmeric
        Vegetable,  // Brinjal (kathirikai), tomato, chili, drumstick
        Fruit,      // Banana (vazhai), mango (maangai), guava, tender coconut
        Tree,       // Palmyra palm, coconut palm, shola tree, mangrove (rhizophora), banyan
        Shrub,      // Tea hedge, flowering jasmine, neem bush
        Grass,      // Korai marsh grass, wild savanna grass
        Herb,       // Tulsi, neem, vetiver, curry leaf
        Flower      // Marigold, lotus, water lily
    }

    public enum GrowthStage
    {
        Seed = 0,
        Sprout = 1,
        Young = 2,
        Mature = 3,
        Flowering = 4,
        Fruiting = 5,
        Harvestable = 6,
        Harvested = 7,
        Regrowing = 8
    }
}
