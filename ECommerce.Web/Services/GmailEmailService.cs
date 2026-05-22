using System.Net;
using System.Net.Mail;

namespace ECommerce.Web.Services
{
    public class GmailEmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public GmailEmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string to, string subject, string htmlBody)
        {
            var section = _config.GetSection("Gmail");
            var host       = section["Host"]        ?? "smtp.gmail.com";
            var port       = int.Parse(section["Port"] ?? "587");
            var email      = section["Email"]!;
            var appPass    = section["AppPassword"]!;
            var senderName = section["SenderName"]  ?? "Kairos Platform";

            using var client = new SmtpClient(host, port)
            {
                EnableSsl   = true,
                Credentials = new NetworkCredential(email, appPass),
                DeliveryMethod = SmtpDeliveryMethod.Network,
            };

            var msg = new MailMessage
            {
                From       = new MailAddress(email, senderName),
                Subject    = subject,
                Body       = htmlBody,
                IsBodyHtml = true,
            };
            msg.To.Add(to);

            await client.SendMailAsync(msg);
        }
    }
}
