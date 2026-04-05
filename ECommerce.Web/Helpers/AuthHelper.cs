namespace ECommerce.Web.Helpers
{
    public static class AuthHelper
    {
        public static bool IsLoggedIn(HttpContext context)
        {
            return context.Session.GetInt32("UserId") != null;
        }

        public static bool IsAdmin(HttpContext context)
        {
            return context.Session.GetString("IsAdmin") == "true";
        }

        public static int? GetUserId(HttpContext context)
        {
            return context.Session.GetInt32("UserId");
        }

        public static string? GetUserName(HttpContext context)
        {
            return context.Session.GetString("UserName");
        }

        public static string? GetUserEmail(HttpContext context)
        {
            return context.Session.GetString("UserEmail");
        }
    }
}