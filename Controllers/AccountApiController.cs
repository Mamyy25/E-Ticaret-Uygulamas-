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
            bool? IsSeller // <--- NEW FLAG
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
                return BadRequest(new { message = "Sifreler eslesmiyor." });

            var emailExists = await _context.Users
                .AnyAsync(u => u.Email == dto.Email);

            if (emailExists)
                return BadRequest(new { message = "Bu email adresi zaten kullaniliyor." });

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                Password = HashPassword(dto.Password),
                CreatedAt = DateTime.Now,
                IsActive = true,
                IsAdmin = false,
                IsSeller = dto.IsSeller ?? false
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // If user is seller, automatically create an empty store
            if (user.IsSeller)
            {
                var store = new Store
                {
                    SellerId = user.Id,
                    Name = user.FullName + " Magazasi",
                    IsActive = true,
                    CreatedAt = DateTime.Now
                };
                _context.Stores.Add(store);
                await _context.SaveChangesAsync();
            }

            return StatusCode(201, new { message = "Kayit basarili. Giris yapabilirsiniz." });
        }

        [HttpPost("login")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var hashedPassword = HashPassword(dto.Password);

            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.Email == dto.Email &&
                    u.Password == hashedPassword &&
                    u.IsActive);

            if (user == null)
                return Unauthorized(new { message = "Email veya sifre hatali." });

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
                    user.IsAdmin,
                    user.IsSeller
                }
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
            if (user == null) return NotFound(new { message = "Kullanici bulunamadi." });

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
                user.LastLoginDate
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
            if (user == null) return NotFound(new { message = "Kullanici bulunamadi." });

            user.FullName = dto.FullName;
            user.Phone = dto.Phone;
            user.Address = dto.Address;
            user.City = dto.City;
            user.ZipCode = dto.ZipCode;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Profil guncellendi." });
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
                new("IsAdmin",                 user.IsAdmin.ToString().ToLower()),
                new("IsSeller",                user.IsSeller.ToString().ToLower())
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
