using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ECommerce.Data;
using ECommerce.Models;

namespace ECommerce.Web.Controllers
{

    /// Sipariþ iþlemleri için API endpoint'leri
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize]   // Tüm sipariþ iþlemleri login gerektiriyor
    public class OrderApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OrderApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        public record PlaceOrderDto(
            string ShippingAddress,
            string? ShippingCity,
            string? ShippingZipCode,
            string? ShippingPhone,
            string? Notes
        );

        // GET: api/order
        /// Kullanýcýnýn sipariþ geçmiþini getirir
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = GetUserIdFromToken();
            if (userId == null) return Unauthorized();

            var orders = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Where(o => o.UserId == userId.Value)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new
                {
                    o.Id,
                    o.OrderDate,
                    o.TotalAmount,
                    o.Status,
                    o.ShippingAddress,
                    o.ShippingCity,
                    itemCount = o.OrderItems.Count,
                    items = o.OrderItems.Select(oi => new
                    {
                        oi.ProductId,
                        oi.ProductName,
                        oi.Quantity,
                        oi.Price,
                        subTotal = oi.Quantity * oi.Price
                    })
                })
                .ToListAsync();

            return Ok(orders);
        }

        /// Belirli bir sipariþin detayýný getirir
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetOrder(int id)
        {
            var userId = GetUserIdFromToken();
            if (userId == null) return Unauthorized();

            var order = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId.Value);

            if (order == null)
                return NotFound(new { message = "Sipariþ bulunamadý." });

            return Ok(new
            {
                order.Id,
                order.OrderDate,
                order.TotalAmount,
                order.Status,
                order.ShippingAddress,
                order.ShippingCity,
                order.ShippingZipCode,
                order.ShippingPhone,
                order.Notes,
                items = order.OrderItems.Select(oi => new
                {
                    oi.ProductId,
                    oi.ProductName,
                    oi.Quantity,
                    oi.Price,
                    subTotal = oi.Quantity * oi.Price
                })
            });
        }

        // POST: api/order
        /// Mevcut sepetten sipariþ oluþturur.
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> PlaceOrder([FromBody] PlaceOrderDto dto)
        {
            var userId = GetUserIdFromToken();
            if (userId == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(dto.ShippingAddress))
                return BadRequest(new { message = "Teslimat adresi zorunludur." });

            // Sepeti getir
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.UserId == userId.Value);

            if (cart == null || !cart.CartItems.Any())
                return BadRequest(new { message = "Sepetiniz boþ." });

            // Stok kontrolü — tüm ürünleri tek seferde kontrol et
            var stockErrors = cart.CartItems
                .Where(ci => ci.Product.Stock < ci.Quantity)
                .Select(ci => $"{ci.Product.Name}: stokta {ci.Product.Stock} adet kaldý.")
                .ToList();

            if (stockErrors.Any())
                return BadRequest(new { message = "Bazý ürünlerde stok yetersiz.", errors = stockErrors });

            // Sipariþ oluþtur
            var order = new Order
            {
                UserId = userId.Value,
                OrderDate = DateTime.Now,
                TotalAmount = cart.TotalAmount,
                Status = "Pending",
                ShippingAddress = dto.ShippingAddress,
                ShippingCity = dto.ShippingCity,
                ShippingZipCode = dto.ShippingZipCode,
                ShippingPhone = dto.ShippingPhone,
                Notes = dto.Notes
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Sipariþ kalemlerini oluþtur ve stoktdan düþ
            foreach (var ci in cart.CartItems)
            {
                _context.OrderItems.Add(new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = ci.ProductId,
                    ProductName = ci.Product.Name,
                    Quantity = ci.Quantity,
                    Price = ci.Product.Price
                });

                ci.Product.Stock -= ci.Quantity;
            }

            // Sepeti temizle
            _context.CartItems.RemoveRange(cart.CartItems);

            await _context.SaveChangesAsync();

            return StatusCode(201, new
            {
                message = "Sipariþiniz baþarýyla oluþturuldu.",
                orderId = order.Id,
                total = order.TotalAmount,
                status = order.Status
            });
        }

        private int? GetUserIdFromToken()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : null;
        }
    }
}
