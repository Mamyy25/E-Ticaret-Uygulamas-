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
    public class ReportsApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportsApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        public record CreateReportDto(
            string TargetType,
            int TargetId,
            string Reason,
            string? Description
        );

        public record ResolveReportDto(string? AdminNote);

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateReport([FromBody] CreateReportDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            if (!new[] { "User", "Store", "Product" }.Contains(dto.TargetType))
                return BadRequest(new { message = "Geçersiz hedef tipi." });

            var report = new Report
            {
                ReporterId = userId.Value,
                TargetType = dto.TargetType,
                TargetId = dto.TargetId,
                Reason = dto.Reason,
                Description = dto.Description,
                Status = "Open",
                CreatedAt = DateTime.Now
            };

            _context.Reports.Add(report);
            await _context.SaveChangesAsync();

            return StatusCode(201, new { message = "Şikayetiniz alındı.", report.Id });
        }

        [HttpGet("admin")]
        [Authorize]
        public async Task<IActionResult> GetAllReports(
            [FromQuery] string? status,
            [FromQuery] string? targetType)
        {
            if (!IsAdmin()) return Forbid();

            var query = _context.Reports
                .Include(r => r.Reporter)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(r => r.Status == status);
            if (!string.IsNullOrEmpty(targetType))
                query = query.Where(r => r.TargetType == targetType);

            var reports = await query.OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id, r.TargetType, r.TargetId, r.Reason, r.Description,
                    r.Status, r.AdminNote, r.CreatedAt, r.ResolvedAt,
                    Reporter = r.Reporter == null ? null : new { r.Reporter.Id, r.Reporter.FullName, r.Reporter.Email }
                }).ToListAsync();

            return Ok(reports);
        }

        [HttpGet("count")]
        public async Task<IActionResult> GetReportCount([FromQuery] string targetType, [FromQuery] int targetId)
        {
            var count = await _context.Reports.CountAsync(r =>
                r.TargetType == targetType && r.TargetId == targetId && r.Status == "Open");
            return Ok(new { count });
        }

        [HttpGet("count-by-target")]
        [Authorize]
        public async Task<IActionResult> GetReportCountsByTarget([FromQuery] string type)
        {
            if (!IsAdmin()) return Forbid();

            var counts = await _context.Reports
                .Where(r => r.TargetType == type && r.Status == "Open")
                .GroupBy(r => r.TargetId)
                .Select(g => new { targetId = g.Key, count = g.Count() })
                .ToListAsync();

            return Ok(counts);
        }

        [HttpPut("{id}/resolve")]
        [Authorize]
        public async Task<IActionResult> ResolveReport(int id, [FromBody] ResolveReportDto dto)
        {
            if (!IsAdmin()) return Forbid();

            var report = await _context.Reports.FindAsync(id);
            if (report == null) return NotFound();

            report.Status = "Resolved";
            report.AdminNote = dto.AdminNote;
            report.ResolvedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Şikayet çözüldü." });
        }

        [HttpPut("{id}/dismiss")]
        [Authorize]
        public async Task<IActionResult> DismissReport(int id, [FromBody] ResolveReportDto dto)
        {
            if (!IsAdmin()) return Forbid();

            var report = await _context.Reports.FindAsync(id);
            if (report == null) return NotFound();

            report.Status = "Dismissed";
            report.AdminNote = dto.AdminNote;
            report.ResolvedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Şikayet reddedildi." });
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : null;
        }

        private bool IsAdmin() => User.FindFirst("UserType")?.Value == "Admin";
    }
}
