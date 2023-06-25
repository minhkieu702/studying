import mongoose, { Schema } from 'mongoose';
import axios from 'axios';
import cron from "node-cron"
const apiBaseUrl = 'http://reso-product-api.reso.vn/api/v1'; // Retrieve the API base URL from the environment variable

// Create an instance of Axios
const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Modify the request config if needed (e.g., add headers, authentication tokens)
    if (typeof window !== 'undefined') { // Check if running in a browser environment
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Handle successful responses
    return response.data;
  },
  (error) => {
    // Handle error responses
    return Promise.reject(error);
  }
);


const getAllProduct = async () => {

  try {
    const loginResponse = await axiosInstance.post('/auth/login', {
      username: 'homiestaff',
      password: '123456',
    });
    const accessToken = loginResponse.accessToken;
    const response = await axiosInstance.get(`/stores/menus`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};
// Define your MongoDB Atlas connection URI
const mongoURI = 'mongodb+srv://admin:admin@cluster0.pfuxtfe.mongodb.net/tiemhomie';

// Connect to MongoDB Atlas
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB Atlas');

    // Define your product schema
    const productSchema = new mongoose.Schema({
      id: {
        type: String,

      },
      code: {
        type: String,

      },
      name: {
        type: String,

      },
      sellingPrice: {
        type: Number,

      },
      picUrl: {
        type: String,

      },
      status: {
        type: String,

      },
      historicalPrice: {
        type: Number,

      },
      discountPrice: {
        type: Number,

      },
      description: {
        type: String,

      },
      displayOrder: {
        type: Number,

      },
      size: {
        type: String,

      },
      type: {
        type: String,

      },
      parentProductId: {
        type: String,

      },
      brandId: {
        type: String,

      },
      categoryId: {
        type: String,

      },
      collectionIds: {
        type: [String],

      },
      extraCategoryIds: {
        type: [String],

      },
      menuProductId: {
        type: String,

      },
    });

    const categorySchema = new mongoose.Schema({
      code: {
        type: String
      },
      description: {
        type: String
      },
      displayOrder: {
        type: String
      },
      id: {
        type: String
      },
      name: {
        type: String
      },
      picUrl: {
        type: String
      },
    })
    const collectionSchema = new mongoose.Schema({
      code: {
        type: String
      },
      description: {
        type: String
      },
      id: {
        type: String
      },
      name: {
        type: String
      },
      picUrl: {
        type: String
      },
    })

    function postData({ CollectionName, Schema, arrays }) {
      const Collection = mongoose.model(CollectionName, Schema);

      // Delete all existing documents in the collection
      Collection.deleteMany({})
        .then(() => {
          console.log(`Deleted all documents from ${CollectionName}`);

          // Fetch new data from the API
          getAllProduct()
            .then((data) => {
              const collections = data[arrays];
              const collectionDocuments = collections.map((collection) => new Collection(collection));
              return Collection.insertMany(collectionDocuments);
            })
            .then(() => {
              console.log(`${CollectionName} inserted successfully`);
              // Perform any additional actions or return the result as needed
            })
            .catch((error) => {
              console.error(`Error inserting ${CollectionName}:`, error);
            })
            .finally(() => {
              // Disconnect from MongoDB Atlas after the operation is complete
              mongoose.disconnect();
            });
        })
        .catch((error) => {
          console.error(`Error deleting documents from ${CollectionName}:`, error);
        });
    }

    //Schedule the function to run at 00:00 AM every day
    cron.schedule('0 0 * * *', () => {
      // Call the function with appropriate parameters
      postData({
        CollectionName: 'Products',
        Schema: productSchema,
        arrays: 'products'
      });

      postData({
        CollectionName: 'Categories',
        Schema: categorySchema,
        arrays: 'categories'
      });
      postData({
        CollectionName: 'Collections',
        Schema: collectionSchema,
        arrays: 'collections'
      });
    })

  })
  .catch((error) => {
    console.error('Error connecting to MongoDB Atlas:', error);
  });
