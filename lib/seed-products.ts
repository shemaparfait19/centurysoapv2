import Product from '@/models/Product';

const INITIAL_PRODUCTS = [
  {
    name: 'Multipurpose Liquid Detergent',
    sizes: [
      { size: '500ml', unit: 'Bottles', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
      { size: '750ml', unit: 'Bottles', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
      { size: '5L', unit: 'Containers', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
      { size: '20L', unit: 'Containers', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
      { size: 'Box', unit: 'Boxes', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
    ],
  },
  {
    name: 'Century Forte Bleach',
    sizes: [
      { size: '500ml', unit: 'Bottles', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
      { size: '750ml', unit: 'Bottles', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
      { size: '5L', unit: 'Containers', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
      { size: '20L', unit: 'Containers', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
      { size: 'Box', unit: 'Boxes', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
    ],
  },
  {
    name: 'Century Handwash',
    sizes: [
      { size: '500ml', unit: 'Bottles', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
      { size: '750ml', unit: 'Bottles', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
      { size: '5L', unit: 'Containers', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
      { size: 'Box', unit: 'Boxes', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
    ],
  },
  {
    name: 'Century Tiles Cleaner',
    sizes: [
      { size: '500ml', unit: 'Bottles', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
      { size: '750ml', unit: 'Bottles', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
      { size: '5L', unit: 'Containers', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
      { size: '20L', unit: 'Containers', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
      { size: 'Box', unit: 'Boxes', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
    ],
  },
  {
    name: 'Century Toilet Cleaner',
    sizes: [
      { size: '500ml', unit: 'Bottles', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
      { size: '750ml', unit: 'Bottles', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
      { size: '5L', unit: 'Containers', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
      { size: '20L', unit: 'Containers', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
      { size: 'Box', unit: 'Boxes', openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 },
    ],
  },
];

export async function seedProducts() {
  try {
    const existingProducts = await Product.countDocuments();
    
    if (existingProducts > 0) {
      console.log('Products already seeded');
      return { success: true, message: 'Products already exist' };
    }

    await Product.insertMany(INITIAL_PRODUCTS);
    console.log('Products seeded successfully');
    return { success: true, message: 'Products seeded successfully' };
  } catch (error) {
    console.error('Error seeding products:', error);
    throw error;
  }
}
