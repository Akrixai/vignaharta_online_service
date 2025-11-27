'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { showToast } from '@/lib/toast';

export default function PublicProductsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products/public');
      const result = await response.json();
      
      if (result.success) {
        setProducts(result.data || []);
      } else {
        showToast.error('Failed to load products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast.error('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const categories = [...new Set(products.map(product => product.category).filter(Boolean))];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory;
    const matchesSearch = searchTerm === '' ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const handleBuyProduct = (product: any) => {
    if (!session) {
      showToast.info('Login Required', {
        description: 'Please login to view product details and purchase'
      });
      router.push(`/login?redirect=/dashboard/products/${product.id}`);
      return;
    }

    if (product.stock_quantity === 0) {
      showToast.error('Product out of stock');
      return;
    }

    // Redirect to dashboard product details page
    router.push(`/dashboard/products/${product.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">Our Products</h1>
          <p className="text-xl text-red-100">
            Discover quality products and services for your needs
          </p>
          <div className="mt-6 flex items-center gap-4 text-red-100">
            <span>🛍️ {products.length} Products Available</span>
            <span>•</span>
            <span>🚚 Fast Delivery</span>
            <span>•</span>
            <span>💯 Quality Assured</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="name">Sort by Name</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={fetchProducts}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  🔄 Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">🛍️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== 'ALL'
                  ? 'Try adjusting your search or filters.'
                  : 'No products are available yet.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map((product) => (
              <Card key={product.id} className={`hover:shadow-xl transition-all duration-300 ${product.stock_quantity === 0 ? 'opacity-75' : ''}`}>
                <CardHeader className="p-0">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-56 object-cover rounded-t-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-56 bg-gradient-to-br from-red-100 to-red-200 rounded-t-lg flex flex-col items-center justify-center text-red-600 ${product.image_url ? 'hidden' : ''}`}>
                    <div className="text-6xl mb-2">🛍️</div>
                    <div className="text-sm font-medium">{product.category || 'Product'}</div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {product.description}
                  </p>

                  {product.features && product.features.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Features:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {product.features.slice(0, 3).map((feature: string, index: number) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="text-gray-500">
                      Stock: {product.stock_quantity || 0}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.stock_quantity > 0
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-red-600">
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleBuyProduct(product)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                      disabled={product.stock_quantity === 0}
                    >
                      {product.stock_quantity > 0 ? (session ? 'Buy Now' : 'Login to Buy') : 'Out of Stock'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
