// AFL Teams with colors and abbreviations
export const AFL_TEAMS = {
  'Adelaide': { abbrev: 'ADE', colors: { primary: '#002A5C', secondary: '#FFD100' } },
  'Brisbane Lions': { abbrev: 'BRI', colors: { primary: '#A30046', secondary: '#FFD100' } },
  'Carlton': { abbrev: 'CAR', colors: { primary: '#00205B', secondary: '#FFFFFF' } },
  'Collingwood': { abbrev: 'COL', colors: { primary: '#000000', secondary: '#FFFFFF' } },
  'Essendon': { abbrev: 'ESS', colors: { primary: '#C8102E', secondary: '#000000' } },
  'Fremantle': { abbrev: 'FRE', colors: { primary: '#4B2C69', secondary: '#FFFFFF' } },
  'Geelong': { abbrev: 'GEE', colors: { primary: '#003F7F', secondary: '#FFFFFF' } },
  'Gold Coast': { abbrev: 'GCS', colors: { primary: '#FFD100', secondary: '#C8102E' } },
  'Greater Western Sydney': { abbrev: 'GWS', colors: { primary: '#FF7A00', secondary: '#1E3A8A' } },
  'Hawthorn': { abbrev: 'HAW', colors: { primary: '#4B2C20', secondary: '#FFD100' } },
  'Melbourne': { abbrev: 'MEL', colors: { primary: '#C8102E', secondary: '#002A5C' } },
  'North Melbourne': { abbrev: 'NME', colors: { primary: '#002A5C', secondary: '#FFFFFF' } },
  'Port Adelaide': { abbrev: 'PTA', colors: { primary: '#00A0B0', secondary: '#000000' } },
  'Richmond': { abbrev: 'RIC', colors: { primary: '#FFD100', secondary: '#000000' } },
  'St Kilda': { abbrev: 'STK', colors: { primary: '#C8102E', secondary: '#000000' } },
  'Sydney': { abbrev: 'SYD', colors: { primary: '#C8102E', secondary: '#FFFFFF' } },
  'West Coast': { abbrev: 'WCE', colors: { primary: '#002A5C', secondary: '#FFD100' } },
  'Western Bulldogs': { abbrev: 'WBD', colors: { primary: '#003F7F', secondary: '#C8102E' } },
} as const;

// Round status colors
export const ROUND_STATUS_COLORS = {
  upcoming: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
} as const;

// Tip correctness colors
export const TIP_COLORS = {
  correct: 'bg-green-100 text-green-800 border-green-200',
  incorrect: 'bg-red-100 text-red-800 border-red-200',
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

// Family group colors for visual distinction
export const FAMILY_COLORS = [
  'bg-red-50 border-red-200',
  'bg-blue-50 border-blue-200',
  'bg-green-50 border-green-200',
  'bg-yellow-50 border-yellow-200',
  'bg-purple-50 border-purple-200',
  'bg-pink-50 border-pink-200',
  'bg-indigo-50 border-indigo-200',
  'bg-gray-50 border-gray-200',
];

// App navigation
export const NAVIGATION_ITEMS = [
  { name: 'Home', path: '/', icon: 'home' },
  { name: 'Enter Tips', path: '/tipping', icon: 'clipboard' },
  { name: 'Ladder', path: '/ladder', icon: 'trophy' },
  { name: 'View All Tips', path: '/history', icon: 'calendar' },
] as const;

// Admin navigation (additional items for admins)
export const ADMIN_NAVIGATION_ITEMS = [
  { name: 'Admin', path: '/admin', icon: 'settings' },
] as const;