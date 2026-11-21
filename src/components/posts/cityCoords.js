// Approximate [lat, lon] for the cities offered by the location API
// (location/states-with-cities), used to place pins on the Posts map.
// A city missing here is simply left off the map, never off the list.
export const CITY_COORDS = {
  // Andhra Pradesh
  Anantapur: [14.68, 77.6, 'Andhra Pradesh'], Eluru: [16.71, 81.1, 'Andhra Pradesh'],
  Guntur: [16.31, 80.44, 'Andhra Pradesh'], Kakinada: [16.99, 82.25, 'Andhra Pradesh'],
  Kurnool: [15.83, 78.04, 'Andhra Pradesh'], Nellore: [14.44, 79.99, 'Andhra Pradesh'],
  Rajahmundry: [17.0, 81.8, 'Andhra Pradesh'], Srikakulam: [18.3, 83.9, 'Andhra Pradesh'],
  Tirupati: [13.63, 79.42, 'Andhra Pradesh'], Vijayawada: [16.51, 80.65, 'Andhra Pradesh'],
  Visakhapatnam: [17.69, 83.22, 'Andhra Pradesh'], Vizianagaram: [18.11, 83.4, 'Andhra Pradesh'],
  // Telangana
  Hyderabad: [17.39, 78.49, 'Telangana'], Karimnagar: [18.44, 79.13, 'Telangana'],
  Khammam: [17.25, 80.15, 'Telangana'], Mahbubnagar: [16.74, 78.0, 'Telangana'],
  Nizamabad: [18.67, 78.09, 'Telangana'], Ramagundam: [18.76, 79.47, 'Telangana'],
  Warangal: [17.97, 79.59, 'Telangana'],
  // Karnataka
  Bangalore: [12.97, 77.59, 'Karnataka'], Belgaum: [15.85, 74.5, 'Karnataka'],
  Davanagere: [14.46, 75.92, 'Karnataka'], Gulbarga: [17.33, 76.83, 'Karnataka'],
  Hubli: [15.36, 75.12, 'Karnataka'], Mangalore: [12.91, 74.86, 'Karnataka'],
  Mysore: [12.3, 76.64, 'Karnataka'],
  // Kerala
  Alappuzha: [9.5, 76.34, 'Kerala'], Kochi: [9.93, 76.27, 'Kerala'], Kollam: [8.89, 76.61, 'Kerala'],
  Kozhikode: [11.26, 75.78, 'Kerala'], Palakkad: [10.79, 76.65, 'Kerala'],
  Thiruvananthapuram: [8.52, 76.94, 'Kerala'], Thrissur: [10.53, 76.21, 'Kerala'],
  // Maharashtra
  Amravati: [20.93, 77.75, 'Maharashtra'], Aurangabad: [19.88, 75.34, 'Maharashtra'],
  Mumbai: [19.08, 72.88, 'Maharashtra'], Nagpur: [21.15, 79.09, 'Maharashtra'],
  Nashik: [20.0, 73.79, 'Maharashtra'], Pune: [18.52, 73.86, 'Maharashtra'],
  Solapur: [17.66, 75.91, 'Maharashtra'],
  // Tamil Nadu
  Chennai: [13.08, 80.27, 'Tamil Nadu'], Coimbatore: [11.02, 76.96, 'Tamil Nadu'],
  Erode: [11.34, 77.72, 'Tamil Nadu'], Madurai: [9.93, 78.12, 'Tamil Nadu'],
  Salem: [11.66, 78.15, 'Tamil Nadu'], Tiruchirappalli: [10.8, 78.69, 'Tamil Nadu'],
  Tirunelveli: [8.71, 77.76, 'Tamil Nadu'],
};
