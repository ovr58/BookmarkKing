/** @type {import('tailwindcss').Config} */
export const content = [
  "./src/**/*.{js,jsx,ts,tsx}",
];
export const darkMode = ['class', '[data-mode="dark"]'];
export const theme = {
  extend: {
    colors: {
      light: '#f8f9fa',
      dark: '#1a1a1a',
      borderLight: '#ced4da',
      borderDark: '#00254d',
      component: '#e9ecef',
      primary: '#3490dc',
      secondary: '#ffed4a',
      danger: '#e3342f',
      componentDark: '#212529',
      primaryDark: '#0e4d92', // Более темный оттенок синего
      secondaryDark: '#d97706', // Более темный оттенок желтого
      dangerDark: '#b91c1c',
    }
  },
};
export const plugins = [];