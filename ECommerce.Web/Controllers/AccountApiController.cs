using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ECommerce.Data;
using ECommerce.Models;
using ECommerce.Models.Enums;

namespace ECommerce.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AccountApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _config;

        public AccountApiController(ApplicationDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        public record RegisterDto(
            string FullName,
            string Email,
            string Password,
            string ConfirmPassword,
            string? UserType
        );

        public record LoginDto(
            string Email,
            string Password
        );

        public record UpdateProfileDto(
            string FullName,
            string? Phone,
            string? Address,
            string? City,
            string? ZipCode
        );

        [HttpPost("register")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (dto.Password != dto.ConfirmPassword)
                return BadRequest(new { message = "Şifreler eşleşmiyor." });

            var emailExists = await _context.Users.AnyAsync(u => u.Email == dto.Email);
            if (emailExists)
                return BadRequest(new { message = "Bu e-posta adresi zaten kullanılıyor." });

            var userType = Enum.TryParse<UserType>(dto.UserType, ignoreCase: true, out var parsed)
                ? parsed
                : UserType.Consumer;

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                Password = HashPassword(dto.Password),
                UserType = userType,
                SubscriptionPlan = SubscriptionPlan.Free,
                IsActive = true,
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Satıcı / esnaf / hizmet sağlayıcı kayıt olursa otomatik mağaza aç
            if (userType is UserType.Seller or UserType.LocalArtisan or UserType.OnlineServiceProvider)
            {
                var storeType = userType switch
                {
                    UserType.Seller => StoreType.Physical,
                    UserType.OnlineServiceProvider => StoreType.Online,
                    _ => StoreType.Service
                };

                var store = new Store
                {
                    SellerId = user.Id,
                    Name = user.FullName + " Mağazası",
                    StoreType = storeType,
                    Status = "Pending",
                    IsActive = false,
                    CreatedAt = DateTime.Now
                };
                _context.Stores.Add(store);
                await _context.SaveChangesAsync();

                return StatusCode(201, new { message = "Başvurunuz alındı. Onay için inceleniyor.", isPending = true });
            }

            return StatusCode(201, new { message = "Kayıt başarılı. Giriş yapabilirsiniz.", isPending = false });
        }

        [HttpPost("login")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var hashedPassword = HashPassword(dto.Password);

            var user = await _context.Users
                .Include(u => u.Store)
                .FirstOrDefaultAsync(u => u.Email == dto.Email && u.Password == hashedPassword);

            if (user == null)
                return Unauthorized(new { message = "E-posta veya şifre hatalı." });

            // Askıya alınmamış VE aktif değilse reddet; askılı kullanıcı girebilir (SuspensionWall görecek)
            if (!user.IsActive && !user.IsSuspended)
                return Unauthorized(new { message = "Hesabınız devre dışı bırakılmıştır." });

            user.LastLoginDate = DateTime.Now;
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);

            return Ok(new
            {
                token,
                user = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    UserType = user.UserType.ToString(),
                    SubscriptionPlan = user.SubscriptionPlan.ToString(),
                    user.IsSuspended,
                    user.SuspensionReason,
                    user.SuspendedAt,
                    StoreStatus = user.Store?.Status
                }
            });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMe()
        {
            var userId = GetUserIdFromToken();
            if (userId == null) return Unauthorized();

            var user = await _context.Users
                .Include(u => u.Store)
                .FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null) return NotFound();

            return Ok(new
            {
                user.Id,
                user.IsSuspended,
                user.SuspensionReason,
                user.SuspendedAt,
                StoreStatus          = user.Store?.Status,
                StoreRejectionReason = user.Store?.RejectionReason,
                StoreId              = user.Store?.Id
            });
        }

        [HttpGet("profile")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetProfile()
        {
            var userId = GetUserIdFromToken();
            if (userId == null) return Unauthorized();

            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null) return NotFound(new { message = "Kullanıcı bulunamadı." });

            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Phone,
                user.Address,
                user.City,
                user.ZipCode,
                user.CreatedAt,
                user.LastLoginDate,
                UserType = user.UserType.ToString(),
                SubscriptionPlan = user.SubscriptionPlan.ToString(),
                user.SubscriptionExpiresAt
            });
        }

        [HttpPut("profile")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = GetUserIdFromToken();
            if (userId == null) return Unauthorized();

            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null) return NotFound(new { message = "Kullanıcı bulunamadı." });

            user.FullName = dto.FullName;
            user.Phone = dto.Phone;
            user.Address = dto.Address;
            user.City = dto.City;
            user.ZipCode = dto.ZipCode;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Profil güncellendi." });
        }

        // ─── ONE-TIME SETUP — eğer hiç Admin yoksa çalışır ───────────
        [HttpPost("setup-first-admin")]
        [AllowAnonymous]
        public async Task<IActionResult> SetupFirstAdmin([FromBody] LoginDto dto)
        {
            var anyAdmin = await _context.Users.AnyAsync(u => u.UserType == UserType.Admin);
            if (anyAdmin) return BadRequest(new { message = "Zaten bir Admin hesabı mevcut. Bu endpoint artık kullanılamaz." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null) return NotFound(new { message = "Bu e-posta ile kayıtlı kullanıcı bulunamadı." });
            if (user.Password != HashPassword(dto.Password)) return Unauthorized(new { message = "Şifre yanlış." });

            user.UserType = UserType.Admin;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"{user.Email} artık Platform Admin. Bu endpoint devre dışı bırakıldı." });
        }

        // ─── ADMIN ───────────────────────────────────────────────────
        [HttpGet("admin/users")]
        [Authorize]
        public async Task<IActionResult> GetAllUsers([FromQuery] string? search, [FromQuery] string? userType)
        {
            var callerType = User.FindFirst("UserType")?.Value;
            if (callerType != "Admin") return Forbid();

            var query = _context.Users.AsQueryable();
            if (!string.IsNullOrEmpty(search))
                query = query.Where(u => u.FullName.Contains(search) || u.Email.Contains(search));
            if (!string.IsNullOrEmpty(userType) && Enum.TryParse<UserType>(userType, true, out var ut))
                query = query.Where(u => u.UserType == ut);

            var query2 = query;
            if (!string.IsNullOrEmpty(Request.Query["status"]))
            {
                var status = Request.Query["status"].ToString();
                if (status == "suspended") query2 = query2.Where(u => u.SuspendedAt != null);
                else if (status == "active") query2 = query2.Where(u => u.SuspendedAt == null && u.IsActive);
            }

            var users = await query2.OrderByDescending(u => u.CreatedAt)
                .Select(u => new
                {
                    u.Id, u.FullName, u.Email, u.Phone, u.City,
                    UserType = u.UserType.ToString(),
                    SubscriptionPlan = u.SubscriptionPlan.ToString(),
                    u.IsActive, u.CreatedAt, u.LastLoginDate,
                    u.IsSuspended, u.SuspensionReason, u.SuspendedAt
                }).ToListAsync();

            return Ok(users);
        }

        [HttpPut("admin/users/{id}/toggle-active")]
        [Authorize]
        public async Task<IActionResult> ToggleUserActive(int id)
        {
            var callerType = User.FindFirst("UserType")?.Value;
            if (callerType != "Admin") return Forbid();

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            user.IsActive = !user.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { user.Id, user.IsActive });
        }

        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Email,          user.Email),
                new(ClaimTypes.Name,           user.FullName),
                new("UserType",                user.UserType.ToString()),
                new("SubscriptionPlan",        user.SubscriptionPlan.ToString())
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private int? GetUserIdFromToken()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : null;
        }

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(bytes);
        }
    }
}
