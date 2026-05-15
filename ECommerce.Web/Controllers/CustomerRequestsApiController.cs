using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerce.Data;
using ECommerce.Models;
using System.Security.Claims;

namespace ECommerce.Web.Controllers
{
    [Route("api/CustomerRequestsApi")]
    [ApiController]
    public class CustomerRequestsApiController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public CustomerRequestsApiController(ApplicationDbContext db) => _db = db;

        // GET /api/CustomerRequestsApi — aktif talepler (herkese açık, sağlayıcılar görür)
        [HttpGet]
        public async Task<IActionResult> GetActive([FromQuery] string? city, [FromQuery] string? category)
        {
            var query = _db.CustomerRequests
                .Include(r => r.Customer)
                .Where(r => r.IsActive && (r.ExpiresAt == null || r.ExpiresAt > DateTime.Now));

            if (!string.IsNullOrEmpty(city))
                query = query.Where(r => r.City != null && r.City.Contains(city));
            if (!string.IsNullOrEmpty(category))
                query = query.Where(r => r.CategoryHint != null && r.CategoryHint.Contains(category));

            var result = await query
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id, r.Title, r.Description, r.CategoryHint,
                    r.Budget, r.City, r.CreatedAt, r.ExpiresAt,
                    CustomerName = r.Customer!.FullName,
                    OfferCount = r.Offers.Count
                })
                .ToListAsync();

            return Ok(result);
        }

        // GET /api/CustomerRequestsApi/mine — kendi taleplerim
        [HttpGet("mine")]
        [Authorize]
        public async Task<IActionResult> GetMine()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _db.CustomerRequests
                .Where(r => r.CustomerId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id, r.Title, r.Description, r.CategoryHint,
                    r.Budget, r.City, r.IsActive, r.CreatedAt, r.ExpiresAt,
                    Offers = r.Offers.Select(o => new
                    {
                        o.Id, o.Price, o.Message, o.Status, o.CreatedAt,
                        StoreName = o.Store!.Name,
                        StoreProfileImage = o.Store.ProfileImageUrl,
                        o.StoreId
                    })
                })
                .ToListAsync();

            return Ok(result);
        }

        // POST /api/CustomerRequestsApi — yeni talep oluştur
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateRequestDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var request = new CustomerRequest
            {
                CustomerId = userId,
                Title = dto.Title,
                Description = dto.Description,
                CategoryHint = dto.CategoryHint,
                Budget = dto.Budget,
                City = dto.City,
                ExpiresAt = dto.ExpiresAt ?? DateTime.Now.AddDays(30)
            };
            _db.CustomerRequests.Add(request);
            await _db.SaveChangesAsync();
            return Ok(new { request.Id, request.Title, request.CreatedAt });
        }

        // DELETE /api/CustomerRequestsApi/{id} — talebimi kapat
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Close(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var request = await _db.CustomerRequests.FindAsync(id);
            if (request == null) return NotFound();
            if (request.CustomerId != userId) return Forbid();

            request.IsActive = false;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // ─── OFFERS ────────────────────────────────────────────────

        // POST /api/CustomerRequestsApi/{requestId}/offers — teklif ver
        [HttpPost("{requestId}/offers")]
        [Authorize]
        public async Task<IActionResult> MakeOffer(int requestId, [FromBody] MakeOfferDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var store = await _db.Stores.FirstOrDefaultAsync(s => s.SellerId == userId);
            if (store == null) return BadRequest("Teklif vermek için bir mağazanız olmalı.");

            var request = await _db.CustomerRequests.FindAsync(requestId);
            if (request == null || !request.IsActive) return NotFound("Talep bulunamadı veya kapatılmış.");

            var alreadyOffered = await _db.RequestOffers.AnyAsync(o => o.RequestId == requestId && o.StoreId == store.Id);
            if (alreadyOffered) return BadRequest("Bu talebe zaten teklif verdiniz.");

            var offer = new RequestOffer
            {
                RequestId = requestId,
                StoreId = store.Id,
                Price = dto.Price,
                Message = dto.Message
            };
            _db.RequestOffers.Add(offer);
            await _db.SaveChangesAsync();
            return Ok(new { offer.Id, offer.Price, offer.Message, offer.Status, offer.CreatedAt });
        }

        // PUT /api/CustomerRequestsApi/offers/{offerId}/accept — teklifi kabul et
        [HttpPut("offers/{offerId}/accept")]
        [Authorize]
        public async Task<IActionResult> AcceptOffer(int offerId)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var offer = await _db.RequestOffers
                .Include(o => o.Request)
                .FirstOrDefaultAsync(o => o.Id == offerId);

            if (offer == null) return NotFound();
            if (offer.Request?.CustomerId != userId) return Forbid();

            // Diğer teklifleri reddet
            var siblings = await _db.RequestOffers
                .Where(o => o.RequestId == offer.RequestId && o.Id != offerId)
                .ToListAsync();
            siblings.ForEach(o => o.Status = "Rejected");

            offer.Status = "Accepted";
            offer.Request!.IsActive = false;
            await _db.SaveChangesAsync();
            return Ok(new { offer.Id, offer.Status });
        }

        // PUT /api/CustomerRequestsApi/offers/{offerId}/reject
        [HttpPut("offers/{offerId}/reject")]
        [Authorize]
        public async Task<IActionResult> RejectOffer(int offerId)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var offer = await _db.RequestOffers
                .Include(o => o.Request)
                .FirstOrDefaultAsync(o => o.Id == offerId);

            if (offer == null) return NotFound();
            if (offer.Request?.CustomerId != userId) return Forbid();

            offer.Status = "Rejected";
            await _db.SaveChangesAsync();
            return Ok(new { offer.Id, offer.Status });
        }

        public record CreateRequestDto(string Title, string Description, string? CategoryHint, decimal? Budget, string? City, DateTime? ExpiresAt);
        public record MakeOfferDto(decimal Price, string Message);
    }
}
