export interface CountryOption {
  value: string;
  label: string;
  stateLabel?: string;
  states?: string[];
}

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "District of Columbia",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

const CANADA_PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
];

const AUSTRALIA_STATES = [
  "Australian Capital Territory",
  "New South Wales",
  "Northern Territory",
  "Queensland",
  "South Australia",
  "Tasmania",
  "Victoria",
  "Western Australia",
];

const INDIA_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const NIGERIA_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "Federal Capital Territory",
];

const SOUTH_AFRICA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

export const COUNTRY_OPTIONS: CountryOption[] = [
  { value: "United States", label: "United States", stateLabel: "State", states: US_STATES },
  { value: "Canada", label: "Canada", stateLabel: "Province / Territory", states: CANADA_PROVINCES },
  { value: "Australia", label: "Australia", stateLabel: "State / Territory", states: AUSTRALIA_STATES },
  { value: "India", label: "India", stateLabel: "State / Territory", states: INDIA_STATES },
  { value: "Nigeria", label: "Nigeria", stateLabel: "State", states: NIGERIA_STATES },
  { value: "South Africa", label: "South Africa", stateLabel: "Province", states: SOUTH_AFRICA_PROVINCES },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
  { value: "Spain", label: "Spain" },
  { value: "Italy", label: "Italy" },
  { value: "Netherlands", label: "Netherlands" },
  { value: "Mexico", label: "Mexico" },
  { value: "Brazil", label: "Brazil" },
  { value: "Ghana", label: "Ghana" },
  { value: "Kenya", label: "Kenya" },
  { value: "United Arab Emirates", label: "United Arab Emirates" },
  { value: "Singapore", label: "Singapore" },
  { value: "New Zealand", label: "New Zealand" },
  { value: "Other", label: "Other" },
];

const countryMap = new Map(COUNTRY_OPTIONS.map((country) => [country.value, country]));

export const getStateOptions = (country?: string): string[] => {
  if (!country) {
    return [];
  }

  return countryMap.get(country)?.states ?? [];
};

export const getStateOptionsWithCustomValue = (country?: string, currentState?: string): string[] => {
  const options = getStateOptions(country);
  if (currentState && options.length && !options.includes(currentState)) {
    return [...options, currentState];
  }
  return options;
};

export const getStateLabel = (country?: string): string => {
  if (!country) {
    return "State / Province";
  }

  return countryMap.get(country)?.stateLabel ?? "State / Province";
};

export const getCountryOptionsWithCustomValue = (country?: string): CountryOption[] => {
  if (country && !countryMap.has(country)) {
    return [...COUNTRY_OPTIONS, { value: country, label: country }];
  }
  return COUNTRY_OPTIONS;
};
