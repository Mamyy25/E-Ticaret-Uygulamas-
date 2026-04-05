// Dosya yolu: ECommerce.Data/Repositories/Repository.cs

using Microsoft.EntityFrameworkCore;

namespace ECommerce.Data.Repositories
{
    public class Repository<T> : IRepository<T> where T : class
    {
        private readonly ApplicationDbContext _context;
        private readonly DbSet<T> _dbSet;
        
        public Repository(ApplicationDbContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }
        
        public async Task<List<T>> GetAllAsync()
        {
            return await _dbSet.ToListAsync();
        }
        
        public async Task<T?> GetByIdAsync(int id)
        {
            return await _dbSet.FindAsync(id);
        }
        
        public async Task AddAsync(T entity)
        {
            await _dbSet.AddAsync(entity);
            await _context.SaveChangesAsync();
        }
        
        public async Task UpdateAsync(T entity)
        {
            _dbSet.Update(entity);
            await _context.SaveChangesAsync();
        }
        
        // ECommerce.Data/Repositories/Repository.cs
        public async Task DeleteAsync(int id)
        {
            // Artık T? döndürüyor
            var entity = await GetByIdAsync(id); 

            // ÇÖZÜM: Null kontrolü eklenmeli
            if (entity != null)
            {
                _dbSet.Remove(entity);
                await _context.SaveChangesAsync();
            }
            // Eğer null ise, varlık bulunamadığı için silme işlemi yapılmaz.
        }
        
    }
}