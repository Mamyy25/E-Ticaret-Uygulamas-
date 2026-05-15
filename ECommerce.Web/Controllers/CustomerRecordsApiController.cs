using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ECommerce.Data;
using ECommerce.Models;
using System.Security.Claims;

namespace ECommerce.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class CustomerRecordsApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public CustomerRecordsApiController(ApplicationDbContext context) => _context = context;

        private async Task<Store?> GetMyStore() =>
            await _context.Stores.FirstOrDefaultAsync(s =>
                s.SellerId == int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!));

        [HttpGet]
        public async Task<ActionResult> GetAll([FromQuery] string? search)
        {
            var store = await GetMyStore();
            if (store == null) return Forbid();

            var q = _context.CustomerRecords
                .Where(cr => cr.StoreId == store.Id && cr.IsActive);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLower();
                q = q.Where(cr => cr.FullName.ToLower().Contains(s)
                               || (cr.Email != null && cr.Email.ToLower().Contains(s))
                               || (cr.Phone != null && cr.Phone.Contains(s)));
            }

            var list = await q.OrderByDescending(cr => cr.CreatedAt)
                .Select(cr => new { cr.Id, cr.FullName, cr.Email, cr.Phone, cr.City, cr.Notes, cr.CreatedAt })
                .ToListAsync();

            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetOne(int id)
        {
            var store = await GetMyStore();
            if (store == null) return Forbid();

            var cr = await _context.CustomerRecords
                .Include(x => x.JobRecords)
                .Include(x => x.PaymentRecords)
                .FirstOrDefaultAsync(x => x.Id == id && x.StoreId == store.Id);

            if (cr == null) return NotFound();
            return Ok(cr);
        }

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] CustomerRecord dto)
        {
            var store = await GetMyStore();
            if (store == null) return Forbid();

            dto.StoreId = store.Id;
            dto.CreatedAt = DateTime.Now;
            _context.CustomerRecords.Add(dto);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetOne), new { id = dto.Id }, dto);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] CustomerRecord dto)
        {
            var store = await GetMyStore();
            if (store == null) return Forbid();

            var existing = await _context.CustomerRecords.FindAsync(id);
            if (existing == null || existing.StoreId != store.Id) return NotFound();

            existing.FullName = dto.FullName;
            existing.Email = dto.Email;
            existing.Phone = dto.Phone;
            existing.Address = dto.Address;
            existing.City = dto.City;
            existing.Notes = dto.Notes;
            existing.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var store = await GetMyStore();
            if (store == null) return Forbid();

            var existing = await _context.CustomerRecords.FindAsync(id);
            if (existing == null || existing.StoreId != store.Id) return NotFound();

            existing.IsActive = false;
            existing.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
