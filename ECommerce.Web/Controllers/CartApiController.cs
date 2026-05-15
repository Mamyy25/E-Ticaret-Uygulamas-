using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ECommerce.Data;
using ECommerce.Models;

namespace ECommerce.Web.Controllers
{
    /// <summary>
    /// Sepet i�lemleri i�in API endpoint'leri
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize]   // T�m sepet i�lemleri login gerektiriyor
    public class CartApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CartApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ���������������������������������������������
        // DTOs
        // ���������������������������������������������

        public record AddToCartDto(int ProductId, int Quantity);
        public record UpdateQuantityDto(int Quantity);

        // ���������������������������������������������
        // GET: api/cart
        // ���������������������������������������������

        /// <summary>
        /// Kullan�c�n�n sepetini getirir
        /// </summary>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetCart()
        {
            var userId = GetUserIdFromToken();
            if (userId == null) return Unauthorized();

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product)
                        .ThenInclude(p => p.Category)
                .FirstOrDefaultAsync(c => c.UserId == userId.Value);

            if (cart == null || !cart.CartItems.Any())
            {
                return Ok(new
                {
                    items = Array.Empty<object>(),
                    totalItems = 0,
                    totalAmount = 0m
                });
            }

            var items = cart.CartItems.Select(ci => new
            {
                cartItemId = ci.Id,
                productId = ci.ProductId,
                productName = ci.Product.Name,
                productImage = ci.Product.ImageUrl,
                category = ci.Product.Category?.Name,
                unitPrice = ci.Product.Price,
                quantity = ci.Quantity,
                subTotal = ci.Product.Price * ci.Quantity,
                maxStock = 999
            });

            return Ok(new
            {
                items,
                totalItems = cart.TotalItems,
                totalAmount = cart.TotalAmount
            });
        }

        // ���������������������������������������������
        // POST: api/cart
        // ���������������������������������������������

        /// <summary>
        /// Sepete �r�n ekler. �r�n zaten varsa miktar� art�r�r.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartDto dto)
        {
            var userId = GetUserIdFromToken();
            if (userId == null) return Unauthorized();

            if (dto.Quantity < 1)
                return BadRequest(new { message = "Miktar en az 1 olmal�d�r." });

            var product = await _context.Products.FindAsync(dto.ProductId);
            if (product == null || product.IsDeleted || !product.IsActive)
                return NotFound(new { message = "�r�n bulunamad�." });

            // Dijital ürün — stok kontrolü yok

            // Sepeti bul veya olu�tur
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId.Value);

            if (cart == null)
            {
                cart = new Cart { UserId = userId.Value, CreatedAt = DateTime.Now };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            var cartItem = cart.CartItems.FirstOrDefault(ci => ci.ProductId == dto.ProductId);

            if (cartItem != null)
            {
                var newQty = cartItem.Quantity + dto.Quantity;
                // Dijital ürün — stok kontrolü yok

                cartItem.Quantity = newQty;
            }
            else
            {
                cartItem = new CartItem
                {
                    CartId = cart.Id,
                    ProductId = dto.ProductId,
                    Quantity = dto.Quantity,
                    AddedAt = DateTime.Now
                };
                _context.CartItems.Add(cartItem);
            }

            cart.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { message = "�r�n sepete eklendi.", totalItems = cart.TotalItems });
        }

        // ���������������������������������������������
        // PUT: api/cart/{cartItemId}
        // ���������������������������������������������

        /// <summary>
        /// Sepetteki bir �r�n�n miktar�n� g�nceller
        /// </summary>
        [HttpPut("{cartItemId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateQuantity(int cartItemId, [FromBody] UpdateQuantityDto dto)
        {
            var userId = GetUserIdFromToken();
            if (userId == null) return Unauthorized();

            if (dto.Quantity < 1)
                return BadRequest(new { message = "Miktar en az 1 olmal�d�r." });

            var cartItem = await _context.CartItems
                .Include(ci => ci.Cart)
                .Include(ci => ci.Product)
                .FirstOrDefaultAsync(ci => ci.Id == cartItemId && ci.Cart.UserId == userId.Value);

            if (cartItem == null)
                return NotFound(new { message = "Sepet ��esi bulunamad�." });

            // Dijital ürün — stok kontrolü yok

            cartItem.Quantity = dto.Quantity;
            cartItem.Cart.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            // G�ncel sepet toplamlar�n� da d�n (React Native state g�ncellemesi i�in)
            var cart = await _context.Carts
                .Include(c => c.CartItems).ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.UserId == userId.Value);

            return Ok(new
            {
                message = "Miktar g�ncellendi.",
                subTotal = cartItem.Quantity * cartItem.Product.Price,
                totalItems = cart!.TotalItems,
                totalAmount = cart.TotalAmount
            });
        }

        // ���������������������������������������������
        // DELETE: api/cart/{cartItemId}
        // ���������������������������������������������

        /// <summary>
        /// Sepetten bir �r�n� kald�r�r
        /// </summary>
        [HttpDelete("{cartItemId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> RemoveFromCart(int cartItemId)
        {
            var userId = GetUserIdFromToken();
            if (userId == null) return Unauthorized();

            var cartItem = await _context.CartItems
                .Include(ci => ci.Cart)
                .FirstOrDefaultAsync(ci => ci.Id == cartItemId && ci.Cart.UserId == userId.Value);

            if (cartItem == null)
                return NotFound(new { message = "Sepet ��esi bulunamad�." });

            _context.CartItems.Remove(cartItem);
            cartItem.Cart.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { message = "�r�n sepetten kald�r�ld�." });
        }

        // ���������������������������������������������
        // DELETE: api/cart
        // ���������������������������������������������

        /// <summary>
        /// Sepeti tamamen temizler
        /// </summary>
        [HttpDelete]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> ClearCart()
        {
            var userId = GetUserIdFromToken();
            if (userId == null) return Unauthorized();

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId.Value);

            if (cart != null && cart.CartItems.Any())
            {
                _context.CartItems.RemoveRange(cart.CartItems);
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Sepet temizlendi." });
        }

        // ���������������������������������������������
        // Yard�mc� metod
        // ���������������������������������������������

        private int? GetUserIdFromToken()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : null;
        }
    }
}
