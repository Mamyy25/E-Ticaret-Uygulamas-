using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ECommerce.Data;
using ECommerce.Models;

namespace ECommerce.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize]
    public class AppointmentsApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AppointmentsApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        public record CreateAppointmentDto(
            int StoreId,
            int? ServicePackageId,
            DateTime AppointmentDate,
            string? Notes
        );

        public record UpdateStatusDto(string Status);

        // Müşterinin kendi randevuları
        [HttpGet("mine")]
        public async Task<IActionResult> GetMine()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var appointments = await _context.Appointments
                .Where(a => a.CustomerId == userId)
                .Include(a => a.Store)
                .Include(a => a.ServicePackage)
                .OrderByDescending(a => a.AppointmentDate)
                .Select(a => new
                {
                    a.Id,
                    a.AppointmentDate,
                    a.Status,
                    a.Notes,
                    a.CreatedAt,
                    StoreId       = a.StoreId,
                    StoreName     = a.Store != null ? a.Store.Name : null,
                    PackageId     = a.ServicePackageId,
                    PackageName   = a.ServicePackage != null ? a.ServicePackage.Name : null,
                    PackagePrice  = a.ServicePackage != null ? a.ServicePackage.Price : (decimal?)null
                })
                .ToListAsync();

            return Ok(appointments);
        }

        // Mağazaya gelen randevular (provider için)
        [HttpGet("for-my-store")]
        public async Task<IActionResult> GetForMyStore()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var store = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == userId);
            if (store == null) return BadRequest(new { message = "Mağazanız yok." });

            var appointments = await _context.Appointments
                .Where(a => a.StoreId == store.Id)
                .Include(a => a.Customer)
                .Include(a => a.ServicePackage)
                .OrderByDescending(a => a.AppointmentDate)
                .Select(a => new
                {
                    a.Id,
                    a.AppointmentDate,
                    a.Status,
                    a.Notes,
                    a.CreatedAt,
                    CustomerId    = a.CustomerId,
                    CustomerName  = a.Customer != null ? a.Customer.FullName : null,
                    CustomerPhone = a.Customer != null ? a.Customer.Phone : null,
                    PackageId     = a.ServicePackageId,
                    PackageName   = a.ServicePackage != null ? a.ServicePackage.Name : null,
                    PackagePrice  = a.ServicePackage != null ? a.ServicePackage.Price : (decimal?)null
                })
                .ToListAsync();

            return Ok(appointments);
        }

        // Randevu oluştur
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAppointmentDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            // Mağaza var mı?
            var storeExists = await _context.Stores.AnyAsync(s => s.Id == dto.StoreId && s.IsActive);
            if (!storeExists) return BadRequest(new { message = "Mağaza bulunamadı." });

            // Geçmiş tarih kontrolü
            if (dto.AppointmentDate < DateTime.Now.AddMinutes(-5))
                return BadRequest(new { message = "Geçmiş tarihe randevu oluşturulamaz." });

            // ServicePackage geçerli mi?
            if (dto.ServicePackageId.HasValue)
            {
                var packageValid = await _context.ServicePackages.AnyAsync(sp =>
                    sp.Id == dto.ServicePackageId.Value &&
                    sp.StoreId == dto.StoreId &&
                    sp.IsActive);
                if (!packageValid)
                    return BadRequest(new { message = "Hizmet paketi geçerli değil." });
            }

            var appointment = new Appointment
            {
                CustomerId       = userId.Value,
                StoreId          = dto.StoreId,
                ServicePackageId = dto.ServicePackageId,
                AppointmentDate  = dto.AppointmentDate,
                Notes            = dto.Notes,
                Status           = "Pending",
                CreatedAt        = DateTime.Now
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMine), new { id = appointment.Id }, new
            {
                appointment.Id,
                appointment.AppointmentDate,
                appointment.Status,
                appointment.Notes
            });
        }

        // Durum güncelle (provider tarafı: onayla / tamamla / iptal)
        [HttpPut("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var allowed = new[] { "Pending", "Approved", "Completed", "Cancelled" };
            if (!allowed.Contains(dto.Status))
                return BadRequest(new { message = "Geçersiz durum." });

            var appointment = await _context.Appointments
                .Include(a => a.Store)
                .FirstOrDefaultAsync(a => a.Id == id);
            if (appointment == null) return NotFound();

            // Yetki: müşteri sadece iptal edebilir, mağaza sahibi her şeyi
            var isOwner    = appointment.Store?.SellerId == userId;
            var isCustomer = appointment.CustomerId == userId;

            if (!isOwner && !isCustomer) return Forbid();
            if (isCustomer && !isOwner && dto.Status != "Cancelled")
                return Forbid();

            appointment.Status = dto.Status;
            await _context.SaveChangesAsync();

            return Ok(new { appointment.Id, appointment.Status });
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : null;
        }
    }
}
