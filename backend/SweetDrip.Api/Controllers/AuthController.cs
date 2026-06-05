using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SweetDrip.Api.Data;
using SweetDrip.Api.DTOs;
using SweetDrip.Api.Services;

namespace SweetDrip.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(SweetDripDbContext db, JwtTokenService jwt) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto body, CancellationToken ct)
    {
        var admin = await db.AdminUsers.AsNoTracking().FirstOrDefaultAsync(ct);
        if (admin == null || admin.Username != body.Username || !BCrypt.Net.BCrypt.Verify(body.Password, admin.PasswordHash))
            return Unauthorized(new { error = "Invalid username or password" });

        return Ok(new LoginResponseDto(jwt.CreateToken(admin.Username), admin.Username));
    }

    [Authorize]
    [HttpPut("credentials")]
    public async Task<IActionResult> UpdateCredentials([FromBody] UpdateCredentialsDto body, CancellationToken ct)
    {
        var admin = await db.AdminUsers.FirstOrDefaultAsync(ct);
        if (admin == null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(body.CurrentPassword, admin.PasswordHash))
            return BadRequest(new { error = "Current password is incorrect" });

        var username = body.Username.Trim();
        var password = body.Password.Trim();
        if (string.IsNullOrEmpty(username)) return BadRequest(new { error = "Username is required" });
        if (password.Length < 6) return BadRequest(new { error = "Password must be at least 6 characters" });

        admin.Username = username;
        admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
        admin.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(new { ok = true });
    }
}
