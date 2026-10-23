export interface DivisionData {
  nameEn: string;
  nameBn: string;
  districts: {
    nameEn: string;
    nameBn: string;
    upazilas: {
      nameEn: string;
      nameBn: string;
    }[];
  }[];
}

export const BANGLADESH_DIVISIONS: DivisionData[] = [
  {
    nameEn: 'Dhaka',
    nameBn: 'ঢাকা',
    districts: [
      {
        nameEn: 'Dhaka',
        nameBn: 'ঢাকা',
        upazilas: [
          { nameEn: 'Dhanmondi', nameBn: 'ধানমন্ডি' },
          { nameEn: 'Gulshan', nameBn: 'গুলশান' },
          { nameEn: 'Banani', nameBn: 'বনানী' },
          { nameEn: 'Uttara', nameBn: 'উত্তরা' },
          { nameEn: 'Mirpur', nameBn: 'মিরপুর' },
          { nameEn: 'Mohammadpur', nameBn: 'মোহাম্মদপুর' },
          { nameEn: 'Motijheel', nameBn: 'মতিঝিল' },
          { nameEn: 'Badda', nameBn: 'বাড্ডা' },
          { nameEn: 'Khilgaon', nameBn: 'খিলগাঁও' },
          { nameEn: 'Savar', nameBn: 'সাভার' },
          { nameEn: 'Keraniganj', nameBn: 'কেরানীগঞ্জ' },
          { nameEn: 'New Market', nameBn: 'নিউ মার্কেট' },
          { nameEn: 'Tejgaon', nameBn: 'তেজগাঁও' }
        ]
      },
      {
        nameEn: 'Gazipur',
        nameBn: 'গাজীপুর',
        upazilas: [
          { nameEn: 'Gazipur Sadar', nameBn: 'গাজীপুর সদর' },
          { nameEn: 'Kaliakair', nameBn: 'কালিয়াকৈর' },
          { nameEn: 'Tongi', nameBn: 'টঙ্গী' },
          { nameEn: 'Kapasia', nameBn: 'কাপাসিয়া' }
        ]
      },
      {
        nameEn: 'Narayanganj',
        nameBn: 'নারায়ণগঞ্জ',
        upazilas: [
          { nameEn: 'Narayanganj Sadar', nameBn: 'নারায়ণগঞ্জ সদর' },
          { nameEn: 'Bandar', nameBn: 'বন্দর' },
          { nameEn: 'Rupganj', nameBn: 'রূপগঞ্জ' },
          { nameEn: 'Sonargaon', nameBn: 'সোনারগাঁও' }
        ]
      }
    ]
  },
  {
    nameEn: 'Chattogram',
    nameBn: 'চট্টগ্রাম',
    districts: [
      {
        nameEn: 'Chattogram',
        nameBn: 'চট্টগ্রাম',
        upazilas: [
          { nameEn: 'Pahartali', nameBn: 'পাহাড়তলী' },
          { nameEn: 'Kotwali', nameBn: 'কোতোয়ালী' },
          { nameEn: 'Panchlaish', nameBn: 'পাঁচলাইশ' },
          { nameEn: 'Halishahar', nameBn: 'হালিশহর' },
          { nameEn: 'Hathazari', nameBn: 'হাটহাজারী' },
          { nameEn: 'Sitakunda', nameBn: 'সীতাকুণ্ড' }
        ]
      },
      {
        nameEn: "Cox's Bazar",
        nameBn: 'কক্সবাজার',
        upazilas: [
          { nameEn: "Cox's Bazar Sadar", nameBn: 'কক্সবাজার সদর' },
          { nameEn: 'Ramu', nameBn: 'রামু' },
          { nameEn: 'Chakaria', nameBn: 'চকোরিয়া' },
          { nameEn: 'Teknaf', nameBn: 'টেকনাফ' }
        ]
      }
    ]
  },
  {
    nameEn: 'Rajshahi',
    nameBn: 'রাজশাহী',
    districts: [
      {
        nameEn: 'Rajshahi',
        nameBn: 'রাজশাহী',
        upazilas: [
          { nameEn: 'Boalia', nameBn: 'বোয়ালিয়া' },
          { nameEn: 'Motihar', nameBn: 'মতিহার' },
          { nameEn: 'Rajpara', nameBn: 'রাজপাড়া' },
          { nameEn: 'Paba', nameBn: 'পবা' }
        ]
      },
      {
        nameEn: 'Bogura',
        nameBn: 'বগুড়া',
        upazilas: [
          { nameEn: 'Bogura Sadar', nameBn: 'বগুড়া সদর' },
          { nameEn: 'Sherpur', nameBn: 'শেরপুর' },
          { nameEn: 'Shibganj', nameBn: 'শিবগঞ্জ' }
        ]
      }
    ]
  },
  {
    nameEn: 'Khulna',
    nameBn: 'খুলনা',
    districts: [
      {
        nameEn: 'Khulna',
        nameBn: 'খুলনা',
        upazilas: [
          { nameEn: 'Khulna Sadar', nameBn: 'খুলনা সদর' },
          { nameEn: 'Sonadanga', nameBn: 'সোনাডাঙ্গা' },
          { nameEn: 'Khalishpur', nameBn: 'খালিশপুর' },
          { nameEn: 'Daulatpur', nameBn: 'দৌলতপুর' }
        ]
      },
      {
        nameEn: 'Jashore',
        nameBn: 'যশোর',
        upazilas: [
          { nameEn: 'Jashore Sadar', nameBn: 'যশোর সদর' },
          { nameEn: 'Jhikargacha', nameBn: 'ঝিকরগাছা' },
          { nameEn: 'Sharsha', nameBn: 'শার্শা' }
        ]
      }
    ]
  },
  {
    nameEn: 'Sylhet',
    nameBn: 'সিলেট',
    districts: [
      {
        nameEn: 'Sylhet',
        nameBn: 'সিলেট',
        upazilas: [
          { nameEn: 'Sylhet Sadar', nameBn: 'সিলেট সদর' },
          { nameEn: 'South Surma', nameBn: 'দক্ষিণ সুরমা' },
          { nameEn: 'Beanibazar', nameBn: 'বিয়ানীবাজার' },
          { nameEn: 'Golapganj', nameBn: 'গোলাপগঞ্জ' }
        ]
      }
    ]
  },
  {
    nameEn: 'Barishal',
    nameBn: 'বরিশাল',
    districts: [
      {
        nameEn: 'Barishal',
        nameBn: 'বরিশাল',
        upazilas: [
          { nameEn: 'Kotwali', nameBn: 'কোতোয়ালী' },
          { nameEn: 'Barishal Sadar', nameBn: 'বরিশাল সদর' },
          { nameEn: 'Babuganj', nameBn: 'বাবুগঞ্জ' }
        ]
      }
    ]
  },
  {
    nameEn: 'Rangpur',
    nameBn: 'রংপুর',
    districts: [
      {
        nameEn: 'Rangpur',
        nameBn: 'রংপুর',
        upazilas: [
          { nameEn: 'Rangpur Sadar', nameBn: 'রংপুর সদর' },
          { nameEn: 'Pirganj', nameBn: 'পীরগঞ্জ' },
          { nameEn: 'Badarganj', nameBn: 'বদরগঞ্জ' }
        ]
      }
    ]
  },
  {
    nameEn: 'Mymensingh',
    nameBn: 'ময়মনসিংহ',
    districts: [
      {
        nameEn: 'Mymensingh',
        nameBn: 'ময়মনসিংহ',
        upazilas: [
          { nameEn: 'Mymensingh Sadar', nameBn: 'ময়মনসিংহ সদর' },
          { nameEn: 'Muktagacha', nameBn: 'মুক্তাগাছা' },
          { nameEn: 'Trishal', nameBn: 'ত্রিশাল' }
        ]
      }
    ]
  }
];

export const validateBangladeshiPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\-]/g, '');
  // Matches +8801[3-9]XXXXXXXX or 01[3-9]XXXXXXXX or 8801[3-9]XXXXXXXX
  return /^(\+?880|0)1[3-9]\d{8}$/.test(cleaned);
};

export const normalizeBangladeshiPhone = (phone: string): string => {
  let cleaned = phone.replace(/[\s\-]/g, '');
  if (cleaned.startsWith('0')) {
    return '+88' + cleaned;
  }
  if (cleaned.startsWith('880')) {
    return '+' + cleaned;
  }
  if (!cleaned.startsWith('+880') && cleaned.startsWith('1')) {
    return '+880' + cleaned;
  }
  return cleaned;
};

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export const toBengaliDigits = (num: number | string): string => {
  return String(num).replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)]);
};

export const formatBDT = (amount: number, locale: 'en' | 'bn' = 'en'): string => {
  // Format with standard thousands separator (e.g., 1,45,000 or 145,000)
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(amount);

  if (locale === 'bn') {
    return `৳ ${toBengaliDigits(formatted)}`;
  }
  return `৳ ${formatted}`;
};
