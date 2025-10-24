# 🐛 GitHub Issues - Security & Code Quality Audit

Этот каталог содержит детальные описания для 11 обнаруженных проблем в проекте Pig Rider.

## 📊 Обзор проблем

| № | Приоритет | Тип | Краткое описание |
|---|-----------|-----|------------------|
| 01 | 🔴 CRITICAL | Runtime Error | Импорт несуществующего DebugOverlay |
| 02 | 🔴 CRITICAL | Undefined Reference | Отсутствует CONFIG.CULLING.THRESHOLD |
| 03 | 🟠 HIGH | Memory Leak | Event listeners в UIController не удаляются |
| 04 | 🟠 HIGH | Memory Leak | Performance shortcut не очищается |
| 05 | 🟠 HIGH | Memory Leak | Audio unlock listeners не очищаются |
| 06 | 🟡 MEDIUM | Dead Code | handleBoosterActivation без callback |
| 07 | 🟡 MEDIUM | SOLID Violation | Нарушение SRP в GameLifecycleManager |
| 08 | 🟢 LOW | Robustness | Отсутствие error handling в async методах |
| 09 | 🟢 LOW | Concurrency | Race conditions в музыкальных переходах |
| 10 | 🟢 LOW | UX | Hardcoded confirm/alert |
| 11 | 🟢 LOW | Code Quality | Console.log в production |

## 🚀 Как создать Issues на GitHub

### Вариант 1: Вручную (рекомендуется для контроля)

1. Перейти на https://github.com/GeorgeStudio96/pig-rider/issues/new
2. Скопировать содержимое файла (например, `01-critical-debugoverlay-import.md`)
3. Вставить в поле описания issue
4. Добавить labels из файла (указаны в начале)
5. Создать issue

**Преимущества:**
- ✅ Полный контроль над каждым issue
- ✅ Можно редактировать перед созданием
- ✅ Можно добавлять дополнительные теги

### Вариант 2: Массовое создание через gh CLI

Если у вас установлен `gh` CLI:

```bash
# Установить gh CLI (если нет)
# macOS:
brew install gh

# Linux:
sudo apt install gh

# Авторизоваться
gh auth login

# Создать все issues автоматически
cd .github/issues
for file in *.md; do
  if [ "$file" != "README.md" ]; then
    # Извлекаем заголовок (первая строка без #)
    TITLE=$(head -n 1 "$file" | sed 's/^# //')

    # Извлекаем labels (вторая строка)
    LABELS=$(sed -n '2p' "$file" | sed 's/^**Labels:** //' | tr '`' ' ' | tr ',' '\n' | xargs)

    # Создаем issue
    gh issue create --title "$TITLE" --body-file "$file" --label "$LABELS"

    echo "✅ Created: $TITLE"
  fi
done
```

### Вариант 3: Импорт через GitHub API (скрипт)

```bash
# Создать Node.js скрипт для массового импорта
node scripts/create-issues.js
```

<details>
<summary>📝 Пример скрипта create-issues.js</summary>

```javascript
const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN // Установить: export GITHUB_TOKEN=your_token
});

const issuesDir = '.github/issues';
const owner = 'GeorgeStudio96';
const repo = 'pig-rider';

async function createIssues() {
  const files = fs.readdirSync(issuesDir)
    .filter(f => f.endsWith('.md') && f !== 'README.md')
    .sort();

  for (const file of files) {
    const content = fs.readFileSync(path.join(issuesDir, file), 'utf8');

    // Извлекаем title (первая строка)
    const title = content.split('\n')[0].replace(/^# /, '');

    // Извлекаем labels (вторая строка)
    const labelsLine = content.split('\n')[1];
    const labels = labelsLine
      .replace(/^\*\*Labels:\*\* /, '')
      .replace(/`/g, '')
      .split(', ')
      .map(l => l.trim());

    try {
      const issue = await octokit.issues.create({
        owner,
        repo,
        title,
        body: content,
        labels
      });

      console.log(`✅ Created #${issue.data.number}: ${title}`);
    } catch (error) {
      console.error(`❌ Failed to create ${file}:`, error.message);
    }

    // Задержка чтобы не превысить rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

createIssues();
```

</details>

## 🎯 Рекомендуемый порядок исправления

### Немедленно (перед релизом):
1. ❗ **Issue #01** - Удалить импорт DebugOverlay
2. ❗ **Issue #02** - Добавить CONFIG.CULLING.THRESHOLD

### Высокий приоритет (memory leaks):
3. 🔴 **Issue #03** - UIController event listeners
4. 🔴 **Issue #04** - Performance shortcut listener
5. 🔴 **Issue #05** - Audio unlock listeners

### Средний приоритет:
6. 🟡 **Issue #06** - Unused callback parameter
7. 🟡 **Issue #07** - SOLID refactoring

### Низкий приоритет (улучшения):
8. 🟢 **Issue #08** - Error handling
9. 🟢 **Issue #09** - Race conditions
10. 🟢 **Issue #10** - Custom UI modals
11. 🟢 **Issue #11** - Console logs cleanup

## 📋 Checklist для каждого Issue

При работе с issue:
- [ ] Прочитать полное описание проблемы
- [ ] Понять код с проблемой
- [ ] Изучить предложенное решение
- [ ] Выполнить чек-лист исправления
- [ ] Протестировать изменения
- [ ] Создать PR с указанием `Fixes #N`
- [ ] Дождаться review
- [ ] Закрыть issue после merge

## 🔗 Полезные ссылки

- [Основной отчет аудита](../../SECURITY_AUDIT_REPORT.md)
- [GitHub Issues Guide](https://docs.github.com/en/issues)
- [CLAUDE.md](../../CLAUDE.md) - Требования к коду (SOLID принципы)

## 📝 Примечания

- Все issue содержат:
  - ✅ Подробное описание проблемы
  - ✅ Примеры кода с проблемой
  - ✅ Последствия
  - ✅ Детальное решение с примерами
  - ✅ Чек-лист исправления
  - ✅ Связанные файлы

- Labels используют стандартную GitHub конвенцию:
  - `bug` - баги и проблемы
  - `enhancement` - улучшения
  - `refactor` - рефакторинг кода
  - Priority: `critical`, `high`, `medium`, `low`
  - Type: `memory-leak`, `performance`, `architecture`, `ui`, etc.

---

**Автор:** Claude Code Security Audit
**Дата:** 2025-10-21
**Ветка аудита:** `dev`
