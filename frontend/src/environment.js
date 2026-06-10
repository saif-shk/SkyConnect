const server = process.env.NODE_ENV === 'production' ?
    (process.env.REACT_APP_BACKEND_URL || "https://skyconnect-backend-n0x2.onrender.com") :
    "http://localhost:8000"


export default server;