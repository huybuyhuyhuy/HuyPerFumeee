export interface Product {
  id: string
  name: string
  brand: string
  price: number
  originalPrice: number
  discountPercent: number
  volume: string
  rating: number
  reviewCount: number
  soldCount: number
  badge?: 'bestseller' | 'new' | 'sale'
  image: string
  gender: 'nam' | 'nu' | 'unisex'
  scentFamily: string
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Dior Sauvage Eau de Parfum',
    brand: 'Dior',
    price: 2850000,
    originalPrice: 3200000,
    discountPercent: 11,
    volume: '100ml',
    rating: 4.9,
    reviewCount: 328,
    soldCount: 1250,
    badge: 'bestseller',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=500&fit=crop',
    gender: 'nam',
    scentFamily: 'Woody'
  },
  {
    id: '2',
    name: 'Chanel Coco Mademoiselle',
    brand: 'Chanel',
    price: 3450000,
    originalPrice: 3450000,
    discountPercent: 0,
    volume: '100ml',
    rating: 4.8,
    reviewCount: 256,
    soldCount: 890,
    badge: 'bestseller',
    image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=400&h=500&fit=crop',
    gender: 'nu',
    scentFamily: 'Floral'
  },
  {
    id: '3',
    name: 'YSL Libre Eau de Parfum',
    brand: 'YSL',
    price: 2650000,
    originalPrice: 2950000,
    discountPercent: 10,
    volume: '50ml',
    rating: 4.7,
    reviewCount: 189,
    soldCount: 567,
    badge: 'sale',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&h=500&fit=crop',
    gender: 'nu',
    scentFamily: 'Floral'
  },
  {
    id: '4',
    name: 'Gucci Bloom',
    brand: 'Gucci',
    price: 2100000,
    originalPrice: 2100000,
    discountPercent: 0,
    volume: '50ml',
    rating: 4.6,
    reviewCount: 145,
    soldCount: 432,
    badge: 'new',
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&h=500&fit=crop',
    gender: 'nu',
    scentFamily: 'Floral'
  },
  {
    id: '5',
    name: 'Versace Eros',
    brand: 'Versace',
    price: 1850000,
    originalPrice: 2200000,
    discountPercent: 16,
    volume: '100ml',
    rating: 4.5,
    reviewCount: 267,
    soldCount: 789,
    badge: 'sale',
    image: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&h=500&fit=crop',
    gender: 'nam',
    scentFamily: 'Fresh'
  },
  {
    id: '6',
    name: 'Tom Ford Oud Wood',
    brand: 'Tom Ford',
    price: 5200000,
    originalPrice: 5200000,
    discountPercent: 0,
    volume: '50ml',
    rating: 4.9,
    reviewCount: 98,
    soldCount: 234,
    image: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=400&h=500&fit=crop',
    gender: 'unisex',
    scentFamily: 'Woody'
  },
  {
    id: '7',
    name: 'Jo Malone English Pear & Freesia',
    brand: 'Jo Malone',
    price: 2800000,
    originalPrice: 2800000,
    discountPercent: 0,
    volume: '100ml',
    rating: 4.7,
    reviewCount: 176,
    soldCount: 456,
    badge: 'new',
    image: 'https://images.unsplash.com/photo-1619994403073-2cec844b8e63?w=400&h=500&fit=crop',
    gender: 'unisex',
    scentFamily: 'Fresh'
  },
  {
    id: '8',
    name: 'Maison Francis Kurkdjian Baccarat Rouge 540',
    brand: 'MFK',
    price: 8500000,
    originalPrice: 8500000,
    discountPercent: 0,
    volume: '70ml',
    rating: 5.0,
    reviewCount: 89,
    soldCount: 156,
    badge: 'bestseller',
    image: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400&h=500&fit=crop',
    gender: 'unisex',
    scentFamily: 'Amber'
  }
]

export const brands = ['Dior', 'Chanel', 'YSL', 'Versace', 'Gucci', 'Tom Ford', 'Jo Malone', 'MFK']

export const priceRanges = [
  { label: 'Dưới 500.000đ', min: 0, max: 500000 },
  { label: '500.000đ - 1.000.000đ', min: 500000, max: 1000000 },
  { label: '1.000.000đ - 2.000.000đ', min: 1000000, max: 2000000 },
  { label: 'Trên 2.000.000đ', min: 2000000, max: Infinity }
]

export const genders = [
  { value: 'nam', label: 'Nam' },
  { value: 'nu', label: 'Nữ' },
  { value: 'unisex', label: 'Unisex' }
]

export const scentFamilies = ['Floral', 'Woody', 'Fresh', 'Amber', 'Musk']

export const volumes = ['30ml', '50ml', '100ml']

export const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price-asc', label: 'Giá thấp đến cao' },
  { value: 'price-desc', label: 'Giá cao đến thấp' },
  { value: 'bestseller', label: 'Bán chạy' },
  { value: 'rating', label: 'Đánh giá cao' }
]

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
}
