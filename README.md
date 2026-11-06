# DimonPrograms

Приложения для головного устройства BMW **MGU (iDrive 7)**. Они ставятся через
[mgu-store](https://github.com/robertnisipeanu/mgu-store) как отдельный источник.

> Неофициальный проект, не связан с BMW AG. Всё, что вы меняете в автомобиле, вы делаете на свой риск.

## Приложения

У всех приложений ID начинается с `dimon_`, поэтому они не конфликтуют с приложениями
исходного проекта idrive7-apps, даже если оба источника добавлены в Store.

| ID | Название | Что делает |
|---|---|---|
| `dimon_live_adjustments` | Engine Config | Заслонка выхлопа; с BM3/MHD — карты прошивки, burbles («попкорн»), Max Cooling; **экспериментально:** отключение xDrive до следующего цикла зажигания |
| `dimon_car_vitals` | M Vitals | Спортивная панель: обороты, наддув, мощность, температуры, шины |
| `dimon_live_data` | Live Data | Живые данные и поездки |
| `dimon_dtc_scanner` | Fault Scanner | Чтение и стирание ошибок всех блоков |
| `dimon_service` | Service | Сервисные интервалы (CBS) |
| `dimon_edrive` | eDrive | Для гибридов: реальный запас хода, батарея, журнал зарядок |
| `dimon_redline` | Redline | Полноэкранный тахометр и индикаторы переключения |
| `dimon_draggy` | Drag Timer | 0–100, 100–200, ¼ мили |
| `dimon_brake_test` | Brake Test | Замер тормозного пути |
| `dimon_dyno` | Virtual Dyno | Виртуальный диностенд |
| `dimon_gforce` | G-Force | Измеритель перегрузок |
| `dimon_warmup` | Warm-Up | Прогрев масла и антифриза |
| `dimon_zf8hp` | Transmission Config | ZF 8HP, только чтение (экспериментально) |
| `dimon_doom` | Doom | Freedoom для стоянки |

### xDrive (экспериментально)

Отключает передний мост штатной диагностической функцией DSC `LMV_FUNKTION`
(`2E DB E1 00`), без разблокировки блоков и без кодирования раздатки. Режим действует
**до следующего выключения зажигания**. Команда отправляется только на стоящем
автомобиле в P. По умолчанию функция выключена в настройках приложения. Подробности,
ограничения и проверенные варианты DSC описаны в
[apps/dimon_live_adjustments/README.md](apps/dimon_live_adjustments/README.md).

## Установка в автомобиль

1. Root SSH к головному устройству, например через
   [idrive7-8-ssh-root](https://github.com/cauliflowermossgrape/idrive7-8-ssh-root).
   **Перепрошивка стирает CAFD/кодирование MGU и Digital Key.** До неё сохраните
   кодирование, после неё восстановите (E-Sys).
2. Установите [mgu-store](https://github.com/robertnisipeanu/mgu-store#install).
3. Репозиторий приватный, поэтому в Store откройте **Settings → Accounts → Add token** и
   добавьте GitHub-токен с доступом *Contents: Read-only* к этому репозиторию.
4. В Store: **Settings → Add source** → `C1pHu4ok/dimonprograms-apps`, ветка `main`.
5. Установите нужные приложения на странице **Store**.

## Разработка

Сборка, эмулятор и тесты работают так же, как в исходном проекте, см.
[README.upstream.md](README.upstream.md). Приложения собираются командой
`python kit/tools/build.py dimon_<app>`.

Обновления исходного проекта подтягиваются из remote `upstream`:

```sh
git fetch upstream
git merge upstream/main
```

После слияния новые приложения автора нужно переименовать под префикс `dimon_`.

## Авторы и лицензия

MIT, см. [LICENSE](LICENSE). Проект основан на
[idrive7-apps](https://github.com/cauliflowermossgrape/idrive7-apps) от cauliflowermossgrape
и участников; GPU-движок mgu-render создан Robert Nisipeanu и IterioDev. Их строки
копирайта сохранены, как требует лицензия.
