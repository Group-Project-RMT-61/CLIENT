import axios from "axios";

const http = axios.create({
  baseURL: "https://b65d-120-188-87-19.ngrok-free.app/",
});

export default http;
