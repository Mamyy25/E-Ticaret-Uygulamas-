using ECommerce.Data;
using ECommerce.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ECommerce.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MessagesApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MessagesApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/MessagesApi/list
        // Gelen kutusundaki son sohbet edilenleri listeler
        [HttpGet("list")]
        public async Task<IActionResult> GetChatList()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            // Kullanıcının attığı VEYA aldığı tüm mesajlar
            var allMessages = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();

            // Sohbetleri hedef kullanıcıya göre grupla (son mesaja göre)
            var chats = allMessages
                .GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
                .Select(g => new
                {
                    UserId = g.Key,
                    // Eğer current user = Sender ise hedef Receiver'dır.
                    UserName = g.First().SenderId == userId ? g.First().Receiver?.FullName : g.First().Sender?.FullName,
                    LastMessage = g.First().Content,
                    LastMessageTime = g.First().CreatedAt,
                    UnreadCount = g.Count(m => m.ReceiverId == userId && !m.IsRead)
                })
                .ToList();

            return Ok(chats);
        }

        // GET: api/MessagesApi/chat/{targetUserId}
        [HttpGet("chat/{targetUserId}")]
        public async Task<IActionResult> GetChatHistory(int targetUserId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var messages = await _context.Messages
                .Where(m => (m.SenderId == userId && m.ReceiverId == targetUserId) ||
                            (m.SenderId == targetUserId && m.ReceiverId == userId))
                .OrderBy(m => m.CreatedAt)
                .Select(m => new {
                    m.Id,
                    m.SenderId,
                    m.ReceiverId,
                    m.Content,
                    m.CreatedAt,
                    m.IsRead,
                    IsMine = m.SenderId == userId
                })
                .ToListAsync();

            // Okunmamışları okundu yap
            var unreadMessages = await _context.Messages
                .Where(m => m.SenderId == targetUserId && m.ReceiverId == userId && !m.IsRead)
                .ToListAsync();
            
            if (unreadMessages.Any())
            {
                foreach (var msg in unreadMessages)
                {
                    msg.IsRead = true;
                }
                await _context.SaveChangesAsync();
            }

            return Ok(messages);
        }

        public class SendMessageDto
        {
            public int ReceiverId { get; set; }
            public string Content { get; set; } = string.Empty;
        }

        // POST: api/MessagesApi/send
        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            if (userId == dto.ReceiverId)
                return BadRequest(new { message = "Kendinize mesaj gönderemezsiniz." });

            var message = new Message
            {
                SenderId = userId,
                ReceiverId = dto.ReceiverId,
                Content = dto.Content,
                IsRead = false,
                CreatedAt = DateTime.Now
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Mesaj gönderildi", data = new { message.Id, message.Content, message.CreatedAt } });
        }
    }
}
