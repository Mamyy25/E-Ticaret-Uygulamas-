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
    public class JobRecordsApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public JobRecordsApiController(ApplicationDbContext context) => _context = context;

        private async Task<Store?> GetMyStore() =>
            await _context.Stores.FirstOrDefaultAsync(s =>
                s.SellerId == int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!));

        [HttpGet]
        public async Task<ActionResult> GetAll([FromQuery] JobStatus? status, [FromQuery] int? customerRecordId)
        {
            var store = await GetMyStore();
            if (store == null) return Forbid();

            var q = _context.JobRecords
                .Include(jr => jr.CustomerRecord)
                .Where(jr => jr.StoreId == store.Id);

            if (status.HasValue) q = q.Where(jr => jr.Status == status);
            if (customerRecordId.HasValue) q = q.Where(jr => jr.CustomerRecordId == customerRecordId);

            var list = await q.OrderByDescending(jr => jr.CreatedAt)
                .Select(jr => new {
                    jr.Id, jr.Title, jr.Description, jr.Amount, jr.Status,
                    jr.ScheduledAt, jr.CompletedAt, jr.CreatedAt,
                    CustomerName = jr.CustomerRecord != null ? jr.CustomerRecord.FullName : null
                }).ToListAsync();

            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetOne(int id)
        {
            var store = await GetMyStore();
            if (store == null) return Forbid();

            var jr = await _context.JobRecords
                .Include(x => x.CustomerRecord)
                .Include(x => x.Appointment)
                .Include(x => x.PaymentRecords)
                .FirstOrDefaultAsync(x => x.Id == id && x.StoreId == store.Id);

            if (jr == null) return NotFound();
            return Ok(jr);
        }

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] JobRecord dto)
        {
            var store = await GetMyStore();
            if (store == null) return Forbid();

            dto.StoreId = store.Id;
            dto.CreatedAt = DateTime.Now;
            _context.JobRecords.Add(dto);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetOne), new { id = dto.Id }, dto);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] JobRecord dto)
        {
            var store = await GetMyStore();
            if (store == null) return Forbid();

            var existing = await _context.JobRecords.FindAsync(id);
            if (existing == null || existing.StoreId != store.Id) return NotFound();

            existing.Title = dto.Title;
            existing.Description = dto.Description;
            existing.Amount = dto.Amount;
            existing.Status = dto.Status;
            existing.CustomerRecordId = dto.CustomerRecordId;
            existing.AppointmentId = dto.AppointmentId;
            existing.ScheduledAt = dto.ScheduledAt;
            existing.CompletedAt = dto.Status == JobStatus.Completed ? DateTime.Now : dto.CompletedAt;
            existing.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPatch("{id}/status")]
        public async Task<ActionResult> UpdateStatus(int id, [FromBody] JobStatusDto dto)
        {
            var store = await GetMyStore();
            if (store == null) return Forbid();

            var existing = await _context.JobRecords.FindAsync(id);
            if (existing == null || existing.StoreId != store.Id) return NotFound();

            existing.Status = dto.Status;
            if (dto.Status == JobStatus.Completed) existing.CompletedAt = DateTime.Now;
            existing.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var store = await GetMyStore();
            if (store == null) return Forbid();

            var existing = await _context.JobRecords.FindAsync(id);
            if (existing == null || existing.StoreId != store.Id) return NotFound();

            _context.JobRecords.Remove(existing);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class JobStatusDto { public JobStatus Status { get; set; } }
}
