export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  currencySymbol: string;
  mode: 'subscription' | 'payment';
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_TFsm1uIFjWNVzV',
    priceId: 'price_1SJN0cD1As63OJ0KfGlADcb1',
    name: 'Creator Pack',
    description: 'Unlock full creative power with KroniQ\'s Creator Pack — featuring unlimited access to AI tools for coding, content creation, video generation, and design. Includes priority processing, premium models (Claude, Gemini, GPT-4), and enhanced generation limits across all studios. Perfect for developers, creators, and innovators who want to build faster and smarter with AI.',
    price: 9.99,
    currency: 'usd',
    currencySymbol: '$',
    mode: 'subscription'
  },
  {
    id: 'prod_TFt8CXnYN4B0F9',
    priceId: 'price_1SJNMCD1As63OJ0KNv1KndJS',
    name: 'Pro Pack',
    description: 'Scale your creativity with KroniQ\'s Pro Plan — designed for professionals who need speed, flexibility, and collaboration. Includes full access to all AI tools, project management, API integration, and advanced video generation.',
    price: 29.00,
    currency: 'cad',
    currencySymbol: 'C$',
    mode: 'subscription'
  }
];

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}

export function getProductById(id: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.id === id);
}