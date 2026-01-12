// Indian States and Union Territories
export const INDIAN_STATES = [
  { code: 'ALL', name: 'All India', emoji: '🇮🇳' },
  { code: 'AP', name: 'Andhra Pradesh', emoji: '🏛️' },
  { code: 'AR', name: 'Arunachal Pradesh', emoji: '🏔️' },
  { code: 'AS', name: 'Assam', emoji: '🌿' },
  { code: 'BR', name: 'Bihar', emoji: '🏛️' },
  { code: 'CG', name: 'Chhattisgarh', emoji: '🌾' },
  { code: 'GA', name: 'Goa', emoji: '🏖️' },
  { code: 'GJ', name: 'Gujarat', emoji: '🦁' },
  { code: 'HR', name: 'Haryana', emoji: '🌾' },
  { code: 'HP', name: 'Himachal Pradesh', emoji: '⛰️' },
  { code: 'JH', name: 'Jharkhand', emoji: '⛏️' },
  { code: 'KA', name: 'Karnataka', emoji: '🌸' },
  { code: 'KL', name: 'Kerala', emoji: '🥥' },
  { code: 'MP', name: 'Madhya Pradesh', emoji: '🐅' },
  { code: 'MH', name: 'Maharashtra', emoji: '🏭' },
  { code: 'MN', name: 'Manipur', emoji: '🏔️' },
  { code: 'ML', name: 'Meghalaya', emoji: '☔' },
  { code: 'MZ', name: 'Mizoram', emoji: '🌲' },
  { code: 'NL', name: 'Nagaland', emoji: '🏔️' },
  { code: 'OR', name: 'Odisha', emoji: '🏛️' },
  { code: 'PB', name: 'Punjab', emoji: '🌾' },
  { code: 'RJ', name: 'Rajasthan', emoji: '🏰' },
  { code: 'SK', name: 'Sikkim', emoji: '🏔️' },
  { code: 'TN', name: 'Tamil Nadu', emoji: '🏛️' },
  { code: 'TS', name: 'Telangana', emoji: '💎' },
  { code: 'TR', name: 'Tripura', emoji: '🌿' },
  { code: 'UP', name: 'Uttar Pradesh', emoji: '🕌' },
  { code: 'UK', name: 'Uttarakhand', emoji: '⛰️' },
  { code: 'WB', name: 'West Bengal', emoji: '🐅' },
  // Union Territories
  { code: 'AN', name: 'Andaman and Nicobar Islands', emoji: '🏝️' },
  { code: 'CH', name: 'Chandigarh', emoji: '🏛️' },
  { code: 'DH', name: 'Dadra and Nagar Haveli and Daman and Diu', emoji: '🏖️' },
  { code: 'DL', name: 'Delhi', emoji: '🏛️' },
  { code: 'JK', name: 'Jammu and Kashmir', emoji: '🏔️' },
  { code: 'LA', name: 'Ladakh', emoji: '🏔️' },
  { code: 'LD', name: 'Lakshadweep', emoji: '🏝️' },
  { code: 'PY', name: 'Puducherry', emoji: '🏖️' }
];

export const getStateByCode = (code: string) => {
  return INDIAN_STATES.find(state => state.code === code);
};

export const getStateOptions = () => {
  return INDIAN_STATES.map(state => ({
    value: state.code,
    label: `${state.emoji} ${state.name}`,
    name: state.name,
    emoji: state.emoji
  }));
};

export const getStatesExceptAll = () => {
  return INDIAN_STATES.filter(state => state.code !== 'ALL');
};