using Folio.Api.Models;

namespace Folio.Api.Services;

public static class JournalParser
{
    public static List<JournalDay> Parse(string markdown)
    {
        var days = new List<JournalDay>();
        var lines = markdown.Split('\n');

        JournalDay? currentDay = null;
        string? currentTopicTitle = null;
        var currentTopicContent = new List<string>();

        foreach (var line in lines)
        {
            if (line.StartsWith("# "))
            {
                FlushTopic(currentDay, currentTopicTitle, currentTopicContent);
                currentTopicTitle = null;
                currentTopicContent.Clear();

                var date = line[2..].Trim();
                currentDay = new JournalDay(date, []);
                days.Add(currentDay);
            }
            else if (line.StartsWith("## ") && currentDay != null)
            {
                FlushTopic(currentDay, currentTopicTitle, currentTopicContent);
                currentTopicTitle = line[3..].Trim();
                currentTopicContent.Clear();
            }
            else if (currentTopicTitle != null)
            {
                currentTopicContent.Add(line);
            }
        }

        FlushTopic(currentDay, currentTopicTitle, currentTopicContent);
        return days;
    }

    private static void FlushTopic(JournalDay? day, string? title, List<string> contentLines)
    {
        if (day == null || title == null) return;
        var content = string.Join('\n', contentLines).Trim();
        day.Topics.Add(new JournalTopic(title, content));
    }

    public static string Serialize(List<JournalDay> days)
    {
        var sb = new System.Text.StringBuilder();
        foreach (var day in days)
        {
            sb.AppendLine($"# {day.Date}");
            foreach (var topic in day.Topics)
            {
                sb.AppendLine($"## {topic.Title}");
                if (!string.IsNullOrWhiteSpace(topic.Content))
                {
                    sb.AppendLine();
                    sb.AppendLine(topic.Content);
                }
                sb.AppendLine();
            }
        }
        return sb.ToString().TrimEnd() + '\n';
    }
}
