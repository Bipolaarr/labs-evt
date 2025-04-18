
[Labworks preview](https://bipolaarr.github.io/labs-evt/)

# Pavel Lahutsenkau

## Flutter developer

- **E-mail:** prostopluggg@gmail.com    
- **Phone:** +375(44) 486-84-78
- **Telegram:** @b1polaarr
- **GitHub:** [github.com/Bipolaarr](https://github.com/Bipolaarr)

## About

_Hi there_

![Beginner Flutter Developer](image.png)

Beginner Flutter developer. Looking for possiblities to improve hard and soft skills, gain knowledge and experince and to work on wide spectre of projects.

## Skills

- _Dart_
- _Flutter_
- _NoSQL Databases (Hive, Isar, MongoDB)_
- _SQL Databases(SQLite, PostgreSQL)_
- _Work with APIs and HTTPs_
- _Git_
- _Get along with principles, patterns and clean code styles_
- _English - _B2 Level_

## Experience

### Сourse Project “Spend.io - Spendings App” – 2023 December, BSUIR

- Developed by me:
  - Backend with Java (Core, Spring, Hibernate technologies used)
  - Frontend with HTML, CSS5, JS

### "Pulse - Streaming App" - 2024 May

- Developed by me:
  - Backend with Dart (Agora, flutter_webrtc, better_player, flutter_bloc  techologies used)
  - Frontend with Flutter
  - MongoDB


### Course Project “Harmony - Music Player App” – 2024 December, BSUIR

- Developed by me:
  - Backend with Dart (just_audio, audio_service, flutter_bloc techologies used)
  - Firebase Realtime Database

## Образование

| Years            | University        | Branch                |
| ---------------- | ----------------- | --------------------- |
| 2022 – This day  | BSUIR             | Systems Engineer      |

## Code example: QuickSort Algorithm 

```Dart
void quickSort(List<int> list, int low, int high) {
  if (low < high) {
    int pivotIndex = _partition(list, low, high);
    quickSort(list, low, pivotIndex - 1);
    quickSort(list, pivotIndex + 1, high);
  }
}

int _partition(List<int> list, int low, int high) {
  int pivot = list[high];
  int i = low - 1;

  for (int j = low; j < high; j++) {
    if (list[j] <= pivot) {
      i++;
      _swap(list, i, j);
    }
  }
  _swap(list, i + 1, high);
  return i + 1;
}

void _swap(List<int> list, int i, int j) {
  int temp = list[i];
  list[i] = list[j];
  list[j] = temp;
}

```