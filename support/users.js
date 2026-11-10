// Пользователи стенда (создаёт stand/stand.py)
module.exports = {
  NEWBIE: { id: 1001, first_name: 'Новичок' }, // только что нажал /start, профиль пустой
  QA: { id: 1002, first_name: 'Тестировщик' }, // ищет «Тестировщик», удалённо
  OTHER: { id: 1003, first_name: 'Другой' }, // второй пользователь с такими же фильтрами
  DISABLED: { id: 1004, first_name: 'Отключён' }, // is_active = false
  STRANGER: { id: 9999, first_name: 'Незнакомец' }, // не нажимал /start, в базе его нет
};
