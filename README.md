# 🚀 DigiPIN – Precision Location-Based Digital Addressing System

## 📌 Overview
DigiPIN is a full-stack MERN application that generates a unique alphanumeric code (DigiPIN) for any physical location using GPS data. The system provides highly precise (5m × 5m grid) location identification, aimed at improving logistics, navigation, and address standardization.

---

## 🎯 Problem Statement
Traditional address systems are:
- Ambiguous and inconsistent  
- Difficult for automated systems  
- Inefficient in rural and dense urban areas  

DigiPIN converts latitude and longitude into a stable, compact, and machine-readable code.

---

## ⚙️ Features
- Phone OTP authentication (Twilio)
- GPS-based location detection (10 samples)
- Noise filtering and clustering
- 5m × 5m grid-based encoding
- Unique DigiPIN generation using hashing
- MongoDB storage for users and locations

---

## 🏗️ Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)

### Services
- Twilio (OTP verification)
- Browser Geolocation API

---

## 📂 Project Structure
