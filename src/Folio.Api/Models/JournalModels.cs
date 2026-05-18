namespace Folio.Api.Models;

public record JournalDay(string Date, List<JournalTopic> Topics);

public record JournalTopic(string Title, string Content);

public record AddTopicRequest(string Date, string Title, string Content);

public record UpdateTopicRequest(string Date, string Title, string Content, string? NewTitle = null);

public record AddDayRequest(string Date);
