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
    public class AppealsApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AppealsApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        public record CreateAppealDto(string Message, int? StoreId);
        public record RespondAppealDto(string AdminResponse, string Status); // Approved | Denied

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateAppeal([FromBody] CreateAppealDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var existingPending = await _context.SuspensionAppeals
                .AnyAsync(a => a.UserId == userId.Value && a.Status == "Pending");
            if (existingPending)
                return BadRequest(new { message = "Bekleyen bir itirazınız zaten var." });

            var appeal = new SuspensionAppeal
            {
                UserId = userId.Value,
                StoreId = dto.StoreId,
                Message = dto.Message,
                Status = "Pending",
                CreatedAt = DateTime.Now
            };

            _context.SuspensionAppeals.Add(appeal);
            await _context.SaveChangesAsync();

            return StatusCode(201, new { message = "İtirazınız iletildi.", appeal.Id });
        }

        [HttpGet("mine")]
        [Authorize]
        public async Task<IActionResult> GetMyAppeals()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var appeals = await _context.SuspensionAppeals
                .Where(a => a.UserId == userId.Value)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new
                {
                    a.Id, a.Message, a.AdminResponse, a.Status, a.CreatedAt, a.RespondedAt, a.StoreId
                }).ToListAsync();

            return Ok(appeals);
        }

        [HttpGet("admin")]
        [Authorize]
        public async Task<IActionResult> GetAllAppeals([FromQuery] string? status)
        {
            if (!IsAdmin()) return Forbid();

            var query = _context.SuspensionAppeals
                .Include(a => a.User)
                .Include(a => a.Store)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(a => a.Status == status);

            var appeals = await query.OrderByDescending(a => a.CreatedAt)
                .Select(a => new
                {
                    a.Id, a.Message, a.AdminResponse, a.Status, a.CreatedAt, a.RespondedAt, a.StoreId,
                    User = a.User == null ? null : new { a.User.Id, a.User.FullName, a.User.Email, a.User.SuspensionReason },
                    Store = a.Store == null ? null : new { a.Store.Id, a.Store.Name, a.Store.SuspensionReason }
                }).ToListAsync();

            return Ok(appeals);
        }

        [HttpPut("{id}/respond")]
        [Authorize]
        public async Task<IActionResult> RespondToAppeal(int id, [FromBody] RespondAppealDto dto)
        {
            if (!IsAdmin()) return Forbid();

            if (!new[] { "Approved", "Denied" }.Contains(dto.Status))
                return BadRequest(new { message = "Geçersiz durum." });

            var appeal = await _context.SuspensionAppeals
                .Include(a => a.User)
                .Include(a => a.Store)
                .FirstOrDefaultAsync(a => a.Id == id);
            if (appeal == null) return NotFound();

            appeal.AdminResponse = dto.AdminResponse;
            appeal.Status = dto.Status;
            appeal.RespondedAt = DateTime.Now;

            // Onaylandıysa askıyı kaldır
            if (dto.Status == "Approved")
            {
                if (appeal.StoreId.HasValue && appeal.Store != null)
                {
                    appeal.Store.Status = "Active";
                    appeal.Store.SuspendedAt = null;
                    appeal.Store.SuspensionReason = null;
                    appeal.Store.IsActive = true;
                }
                else if (appeal.User != null)
                {
                    appeal.User.SuspendedAt = null;
                    appeal.User.SuspensionReason = null;
                    appeal.User.SuspendedByAdminId = null;
                    appeal.User.IsActive = true;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = dto.Status == "Approved" ? "İtiraz onaylandı, askı kaldırıldı." : "İtiraz reddedildi." });
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : null;
        }

        private bool IsAdmin() => User.FindFirst("UserType")?.Value == "Admin";
    }
}
