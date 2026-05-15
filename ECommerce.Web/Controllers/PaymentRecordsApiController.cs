using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ECommerce.Data;
using ECommerce.Models;
using ECommerce.Models.Enums;
using System.Security.Claims;

namespace ECommerce.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class PaymentRecordsApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public PaymentRecordsApiController(ApplicationDbContext context) => _context = context;

        private async Task<Store?> GetMyStore() =>
            await _context.Stores.FirstOrDefaultAsync(s =>
                s.SellerId == int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!));

        [HttpGet]
        public async Task<ActionResult> GetAll(
            [FromQuery] PaymentDirection? direction,
            [FromQuery] int? customerRecordId,
            [FromQuery] int? jobRecordId,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to)
        {
            var store = await GetMyStore();
            if (store == null) return Forbid();

            var q = _context.PaymentRecords
                .Include(pr => pr.CustomerRecord)
                .Include(pr => pr.JobRecord)
                .Where(pr => pr.StoreId == store.Id);

            if (direction.HasValue) q = q.Where(pr => pr.Direction == direction);
            if (customerRecordId.HasValue) q = q.Where(pr => pr.CustomerRecordId == customerRecordId);
            if (jobRecordId.HasValue) q = q.Where(pr => pr.JobRecordId == jobRecordId);
            if (from.HasValue) q = q.Where(pr => pr.PaidAt >= from);
            if (to.HasValue) q = q.Where(pr => pr.PaidAt <= to);

            var list = await q.OrderByDescending(pr => pr.PaidAt)
                .Select(pr => new {
                    pr.Id, pr.Amount, pr.Method, pr.Direction, pr.Description, pr.PaidAt,
                    CustomerName = pr.CustomerRecord != null ? pr.CustomerRecord.FullName : null,
                    JobTitle = pr.JobRecord != null ? pr.JobRecord.Title : null
                }).ToListAsync();

            // Özet
            var totalIn  = list.Where(p => p.Direction == PaymentDirection.Incoming).Sum(p => p.Amount);
            var totalOut = list.Where(p => p.Direction == PaymentDirection.Outgoing).Sum(p => p.Amount);

            return Ok(new { records = list, totalIncoming = totalIn, totalOutgoing = totalOut, net = totalIn - totalOut });
        }

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] PaymentRecord dto)
        {
            var store = await GetMyStore();
            if (store == null) return Forbid();

            dto.StoreId = store.Id;
            dto.CreatedAt = DateTime.Now;
            _context.PaymentRecords.Add(dto);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), new { }, dto);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var store = await GetMyStore();
            if (store == null) return Forbid();

            var existing = await _context.PaymentRecords.FindAsync(id);
            if (existing == null || existing.StoreId != store.Id) return NotFound();

            _context.PaymentRecords.Remove(existing);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
