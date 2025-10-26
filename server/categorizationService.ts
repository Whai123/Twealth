/**
 * Smart Transaction Categorization Service
 * Automatically detects spending categories from merchant names and descriptions
 */

export interface CategoryMatch {
  category: string;
  confidence: 'high' | 'medium' | 'low';
  matchedKeyword: string;
}

// Comprehensive merchant keyword database
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  // Food & Dining
  'Dining': [
    'restaurant', 'cafe', 'coffee', 'starbucks', 'dunkin', 'mcdonald', 'burger', 'pizza', 'subway',
    'chipotle', 'kfc', 'taco bell', 'wendy', 'chick-fil-a', 'panera', 'domino', 'papa john',
    'diner', 'bistro', 'grill', 'kitchen', 'eatery', 'bar & grill', 'steakhouse', 'sushi',
    'thai', 'chinese', 'italian', 'mexican', 'food delivery', 'uber eats', 'doordash', 'grubhub',
    'postmates', 'seamless', 'deliveroo', 'foodpanda', 'grab food', 'dining', 'meal'
  ],
  
  // Groceries
  'Groceries': [
    'walmart', 'target', 'costco', 'safeway', 'kroger', 'whole foods', 'trader joe',
    'aldi', 'publix', 'sprouts', 'food lion', 'stop & shop', 'giant', 'albertsons',
    'grocery', 'supermarket', 'market', 'mart', 'fresh', 'organic', 'produce',
    'wegmans', 'harris teeter', 'smiths', 'ralphs', 'vons', 'pavilions', 'carrefour',
    'tesco', 'sainsbury', 'asda', 'lidl', 'mercadona', 'lotus', 'big c'
  ],
  
  // Transportation
  'Transportation': [
    'shell', 'chevron', 'exxon', 'bp', 'mobil', 'texaco', 'arco', 'valero', 'citgo',
    'gas station', 'fuel', 'petrol', 'uber', 'lyft', 'taxi', 'cab', 'transit',
    'metro', 'subway', 'bus', 'train', 'parking', 'toll', 'car wash', 'car repair',
    'auto', 'mechanic', 'tire', 'oil change', 'smog check', 'dmv', 'registration',
    'grab', 'gojek', 'ola', 'didi', 'bolt', 'via', 'public transport', 'mrt', 'lrt'
  ],
  
  // Shopping
  'Shopping': [
    'amazon', 'ebay', 'etsy', 'walmart.com', 'target.com', 'bestbuy', 'apple store',
    'nike', 'adidas', 'h&m', 'zara', 'gap', 'old navy', 'forever 21', 'uniqlo',
    'nordstrom', 'macy', 'kohl', 'jcpenney', 'dillard', 'sephora', 'ulta',
    'home depot', 'lowe', 'ikea', 'wayfair', 'overstock', 'bed bath', 'container store',
    'aliexpress', 'shopee', 'lazada', 'tokopedia', 'bukalapak', 'mercado libre',
    'clothing', 'apparel', 'fashion', 'shoes', 'accessories', 'jewelry', 'cosmetics'
  ],
  
  // Entertainment
  'Entertainment': [
    'netflix', 'hulu', 'disney+', 'hbo', 'amazon prime', 'spotify', 'apple music',
    'youtube', 'twitch', 'playstation', 'xbox', 'nintendo', 'steam', 'epic games',
    'cinema', 'theater', 'movie', 'amc', 'regal', 'concert', 'ticket', 'event',
    'spotify', 'pandora', 'tidal', 'soundcloud', 'audible', 'kindle', 'books',
    'paramount+', 'peacock', 'max', 'showtime', 'starz', 'funimation', 'crunchyroll',
    'gaming', 'game', 'entertainment', 'streaming', 'subscription'
  ],
  
  // Utilities
  'Utilities': [
    'electric', 'water', 'gas company', 'power', 'utility', 'sewage', 'garbage',
    'waste management', 'pg&e', 'con edison', 'duke energy', 'southern company',
    'internet', 'cable', 'phone', 'wireless', 'verizon', 'at&t', 't-mobile',
    'comcast', 'spectrum', 'xfinity', 'cox', 'centurylink', 'frontier',
    'broadband', 'wifi', 'mobile', 'cellular', 'landline', 'bill'
  ],
  
  // Healthcare
  'Healthcare': [
    'pharmacy', 'cvs', 'walgreens', 'rite aid', 'drug', 'prescription', 'medicine',
    'doctor', 'dentist', 'hospital', 'clinic', 'medical', 'health', 'urgent care',
    'laboratory', 'radiology', 'therapy', 'counseling', 'psychiatrist', 'psychologist',
    'optometry', 'vision', 'glasses', 'contact lens', 'hearing', 'physical therapy',
    'chiropractor', 'acupuncture', 'massage', 'wellness', 'gym', 'fitness'
  ],
  
  // Housing
  'Rent': [
    'rent', 'lease', 'landlord', 'property management', 'apartment', 'housing',
    'mortgage', 'home loan', 'property tax', 'hoa', 'homeowner', 'condo fee'
  ],
  
  // Insurance
  'Insurance': [
    'insurance', 'geico', 'state farm', 'allstate', 'progressive', 'liberty mutual',
    'farmers', 'nationwide', 'usaa', 'aaa', 'metlife', 'prudential', 'aetna',
    'blue cross', 'cigna', 'humana', 'kaiser', 'united health', 'health insurance',
    'life insurance', 'auto insurance', 'home insurance', 'renters insurance'
  ],
  
  // Education
  'Education': [
    'tuition', 'university', 'college', 'school', 'course', 'udemy', 'coursera',
    'masterclass', 'skillshare', 'linkedin learning', 'pluralsight', 'datacamp',
    'books', 'textbook', 'supplies', 'student', 'education', 'learning', 'training'
  ],
  
  // Personal Care
  'Personal Care': [
    'salon', 'barber', 'haircut', 'spa', 'nail', 'beauty', 'cosmetic', 'makeup',
    'skincare', 'fragrance', 'perfume', 'grooming', 'shave', 'wax', 'facial'
  ],
  
  // Travel
  'Travel': [
    'airline', 'flight', 'hotel', 'airbnb', 'booking.com', 'expedia', 'hotels.com',
    'marriott', 'hilton', 'hyatt', 'ihg', 'travel', 'vacation', 'trip', 'resort',
    'hostel', 'motel', 'inn', 'rental car', 'hertz', 'enterprise', 'avis', 'budget',
    'agoda', 'traveloka', 'tiket', 'pegipegi', 'cruise', 'airport'
  ],
  
  // Subscriptions
  'Subscriptions': [
    'patreon', 'onlyfans', 'substack', 'medium', 'new york times', 'washington post',
    'wall street journal', 'economist', 'financial times', 'bloomberg', 'membership',
    'adobe', 'microsoft 365', 'office 365', 'dropbox', 'google one', 'icloud',
    'cloud storage', 'software subscription', 'saas', 'monthly subscription'
  ],
  
  // Pets
  'Pets': [
    'petco', 'petsmart', 'pet', 'veterinary', 'vet', 'animal', 'dog', 'cat',
    'grooming', 'pet food', 'pet supplies', 'pet care', 'kennel', 'daycare'
  ],
  
  // Charity
  'Charity': [
    'donation', 'charity', 'foundation', 'nonprofit', 'give', 'contribution',
    'red cross', 'unicef', 'salvation army', 'goodwill', 'church', 'temple',
    'mosque', 'synagogue', 'religious', 'tithe', 'offering', 'relief fund'
  ],
  
  // Fees & Charges
  'Fees': [
    'fee', 'charge', 'service charge', 'atm', 'overdraft', 'late fee', 'penalty',
    'interest', 'finance charge', 'transaction fee', 'processing fee', 'bank fee'
  ],
  
  // Income categories
  'Salary': [
    'salary', 'payroll', 'paycheck', 'wage', 'direct deposit', 'employer',
    'monthly pay', 'bi-weekly', 'weekly pay', 'compensation'
  ],
  
  'Freelance': [
    'freelance', 'contractor', 'consulting', 'gig', 'upwork', 'fiverr', 'freelancer',
    'contract work', 'client payment', 'invoice payment', 'project payment'
  ],
  
  'Investment': [
    'dividend', 'capital gain', 'interest income', 'stock sale', 'crypto profit',
    'rental income', 'investment return', 'profit', 'passive income'
  ],
  
  'Refund': [
    'refund', 'reimbursement', 'cashback', 'rebate', 'return', 'credit'
  ],
};

/**
 * Automatically categorize a transaction based on description and merchant name
 */
export function autoCategorizeTransaction(description: string, amount: number, type: 'income' | 'expense' | 'transfer'): string {
  if (!description || description.trim().length === 0) {
    return 'Other';
  }

  const normalizedDesc = description.toLowerCase().trim();
  
  // For income transactions, check income categories first
  if (type === 'income') {
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      // Only check income-related categories for income transactions
      if (['Salary', 'Freelance', 'Investment', 'Refund'].includes(category)) {
        for (const keyword of keywords) {
          if (normalizedDesc.includes(keyword.toLowerCase())) {
            return category;
          }
        }
      }
    }
    return 'Other Income';
  }
  
  // For expenses, check all expense categories
  if (type === 'expense') {
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      // Skip income categories
      if (['Salary', 'Freelance', 'Investment', 'Refund'].includes(category)) {
        continue;
      }
      
      for (const keyword of keywords) {
        if (normalizedDesc.includes(keyword.toLowerCase())) {
          return category;
        }
      }
    }
  }
  
  return 'Other';
}

/**
 * Get category suggestions with confidence scores
 */
export function getCategorySuggestions(description: string, type: 'income' | 'expense' | 'transfer'): CategoryMatch[] {
  if (!description || description.trim().length === 0) {
    return [];
  }

  const normalizedDesc = description.toLowerCase().trim();
  const matches: CategoryMatch[] = [];
  
  // Filter categories based on transaction type
  const relevantCategories = Object.entries(CATEGORY_KEYWORDS).filter(([category]) => {
    if (type === 'income') {
      return ['Salary', 'Freelance', 'Investment', 'Refund'].includes(category);
    } else if (type === 'expense') {
      return !['Salary', 'Freelance', 'Investment', 'Refund'].includes(category);
    }
    return true;
  });
  
  for (const [category, keywords] of relevantCategories) {
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      
      // Exact word match = high confidence
      const wordBoundary = new RegExp(`\\b${keywordLower}\\b`);
      if (wordBoundary.test(normalizedDesc)) {
        matches.push({ category, confidence: 'high', matchedKeyword: keyword });
        break; // Only one match per category
      }
      
      // Partial match = medium confidence
      if (normalizedDesc.includes(keywordLower)) {
        matches.push({ category, confidence: 'medium', matchedKeyword: keyword });
        break;
      }
    }
  }
  
  // Sort by confidence (high > medium > low)
  return matches.sort((a, b) => {
    const confidenceOrder = { high: 3, medium: 2, low: 1 };
    return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
  });
}

/**
 * Get all available categories for a transaction type
 */
export function getAvailableCategories(type: 'income' | 'expense' | 'transfer'): string[] {
  const allCategories = Object.keys(CATEGORY_KEYWORDS);
  
  if (type === 'income') {
    return ['Salary', 'Freelance', 'Investment', 'Refund', 'Other Income'];
  } else if (type === 'expense') {
    return allCategories.filter(cat => 
      !['Salary', 'Freelance', 'Investment', 'Refund'].includes(cat)
    ).concat(['Other']);
  }
  
  return allCategories.concat(['Other', 'Other Income']);
}

/**
 * Validate if a category is valid for a transaction type
 */
export function isValidCategory(category: string, type: 'income' | 'expense' | 'transfer'): boolean {
  return getAvailableCategories(type).includes(category);
}
