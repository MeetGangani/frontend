import axios from 'axios';
import config from '../config/config';

const instance = axios.create({
  baseURL: `${config.API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default instance; 
