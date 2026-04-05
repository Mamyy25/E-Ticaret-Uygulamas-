using ECommerce.Models;
using ECommerce.Data.Repositories;

namespace ECommerce.Business.Services
{
    public interface IProductService
    {
        Task<List<Product>> GetAllProductsAsync();
        Task<Product> GetProductByIdAsync(int id);
        Task<List<Product>> GetProductsByCategoryAsync(int categoryId);
    }
    
    public class ProductService : IProductService
    {
        private readonly IRepository<Product> _productRepository;
        
        public ProductService(IRepository<Product> productRepository)
        {
            _productRepository = productRepository;
        }
        
        public async Task<List<Product>> GetAllProductsAsync()
        {
            return await _productRepository.GetAllAsync();
        }
        
        public async Task<Product> GetProductByIdAsync(int id)
        {
            return await _productRepository.GetByIdAsync(id);
        }
        
        public async Task<List<Product>> GetProductsByCategoryAsync(int categoryId)
        {
            var allProducts = await _productRepository.GetAllAsync();
            return allProducts.Where(p => p.CategoryId == categoryId).ToList();
        }
    }
}