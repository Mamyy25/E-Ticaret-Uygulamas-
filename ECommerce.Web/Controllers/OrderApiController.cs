using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ECommerce.Data;
using ECommerce.Models;

namespace ECommerce.Web.Controllers
{

    /// Sipari� i�lemleri i�in API endpoint'leri
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize]   // T�m sipari� i�lemleri login gerektiriyor
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
        /// Kullan�c�n�n sipari� ge�mi�ini getirir
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

        /// Belirli bir sipari�in detay�n� getirir
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
                return NotFound(new { message = "Sipari� bulunamad�." });

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
        /// Mevcut sepetten sipari� olu�turur.
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
                return BadRequest(new { message = "Sepetiniz bo�." });

            // Stok kontrol� � t�m �r�nleri tek seferde kontrol et
            var stockErrors = cart.CartItems
                .Where(ci => ci.Product.Stock < ci.Quantity)
                .Select(ci => $"{ci.Product.Name}: stokta {ci.Product.Stock} adet kald�.")
                .ToList();

            if (stockErrors.Any())
                return BadRequest(new { message = "Baz� �r�nlerde stok yetersiz.", errors = stockErrors });

            // Sipari� olu�tur
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

            // Sipari� kalemlerini olu�tur ve stoktdan d��
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
                message = "Sipari�iniz ba�ar�yla olu�turuldu.",
                orderId = order.Id,
                total = order.TotalAmount,
                status = order.Status
            });
        }

        [HttpGet("seller-orders")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSellerOrders()
        {
            var userId = GetUserIdFromToken();
            if (userId == null) return Unauthorized();

            var store = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == userId.Value);
            if (store == null) return NotFound(new { message = "Mağaza bulunamadı." });

            var sellerOrders = await _context.OrderItems
                .Include(oi => oi.Order)
                    .ThenInclude(o => o.User)
                .Include(oi => oi.Product)
                .Where(oi => oi.Product.StoreId == store.Id)
                .OrderByDescending(oi => oi.Order.OrderDate)
                .Select(oi => new
                {
                    orderItemId = oi.Id,
                    orderId = oi.OrderId,
                    orderDate = oi.Order.OrderDate,
                    status = oi.Order.Status,
                    productId = oi.ProductId,
                    productName = oi.ProductName,
                    quantity = oi.Quantity,
                    price = oi.Price,
                    subTotal = oi.Quantity * oi.Price,
                    buyerName = oi.Order.User.FullName,
                    shippingAddress = oi.Order.ShippingAddress,
                    shippingCity = oi.Order.ShippingCity,
                    shippingPhone = oi.Order.ShippingPhone
                })
                .ToListAsync();

            return Ok(sellerOrders);
        }

        private int? GetUserIdFromToken()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : null;
        }
    }
}
