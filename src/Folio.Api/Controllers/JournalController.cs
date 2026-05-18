using Folio.Api.Models;
using Folio.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Folio.Api.Controllers;

[ApiController]
[Route("api/journal")]
public class JournalController : ControllerBase
{
    private readonly IFileStorageProvider _storage;

    public JournalController(IFileStorageProvider storage)
    {
        _storage = storage;
    }

    [HttpGet]
    public async Task<ActionResult<List<JournalDay>>> GetAll(CancellationToken ct)
    {
        var markdown = await _storage.ReadAsync(ct);
        return JournalParser.Parse(markdown);
    }

    [HttpPost("day")]
    public async Task<IActionResult> AddDay([FromBody] AddDayRequest request, CancellationToken ct)
    {
        var markdown = await _storage.ReadAsync(ct);
        var days = JournalParser.Parse(markdown);

        if (days.Any(d => d.Date == request.Date))
            return Conflict("Tag existiert bereits.");

        var newDay = new JournalDay(request.Date, []);
        var insertAt = days.FindIndex(d => string.Compare(d.Date, request.Date) < 0);
        if (insertAt < 0) days.Add(newDay);
        else days.Insert(insertAt, newDay);
        await _storage.WriteAsync(JournalParser.Serialize(days), ct);
        return Ok();
    }

    [HttpPost("topic")]
    public async Task<IActionResult> AddTopic([FromBody] AddTopicRequest request, CancellationToken ct)
    {
        var markdown = await _storage.ReadAsync(ct);
        var days = JournalParser.Parse(markdown);

        var day = days.FirstOrDefault(d => d.Date == request.Date);
        if (day == null) return NotFound("Tag nicht gefunden.");
        if (day.Topics.Any(t => t.Title == request.Title))
            return Conflict("Thema existiert bereits.");

        day.Topics.Add(new JournalTopic(request.Title, request.Content));
        await _storage.WriteAsync(JournalParser.Serialize(days), ct);
        return Ok();
    }

    [HttpPut("topic")]
    public async Task<IActionResult> UpdateTopic([FromBody] UpdateTopicRequest request, CancellationToken ct)
    {
        var markdown = await _storage.ReadAsync(ct);
        var days = JournalParser.Parse(markdown);

        var day = days.FirstOrDefault(d => d.Date == request.Date);
        if (day == null) return NotFound("Tag nicht gefunden.");

        var idx = day.Topics.FindIndex(t => t.Title == request.Title);
        if (idx < 0) return NotFound("Thema nicht gefunden.");

        day.Topics[idx] = new JournalTopic(request.Title, request.Content);
        await _storage.WriteAsync(JournalParser.Serialize(days), ct);
        return Ok();
    }

    [HttpDelete("day")]
    public async Task<IActionResult> DeleteDay([FromQuery] string date, CancellationToken ct)
    {
        var markdown = await _storage.ReadAsync(ct);
        var days = JournalParser.Parse(markdown);

        var removed = days.RemoveAll(d => d.Date == date);
        if (removed == 0) return NotFound("Tag nicht gefunden.");

        await _storage.WriteAsync(JournalParser.Serialize(days), ct);
        return Ok();
    }

    [HttpDelete("topic")]
    public async Task<IActionResult> DeleteTopic([FromQuery] string date, [FromQuery] string title, CancellationToken ct)
    {
        var markdown = await _storage.ReadAsync(ct);
        var days = JournalParser.Parse(markdown);

        var day = days.FirstOrDefault(d => d.Date == date);
        if (day == null) return NotFound("Tag nicht gefunden.");

        var removed = day.Topics.RemoveAll(t => t.Title == title);
        if (removed == 0) return NotFound("Thema nicht gefunden.");

        await _storage.WriteAsync(JournalParser.Serialize(days), ct);
        return Ok();
    }
}
