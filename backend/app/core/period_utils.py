from datetime import date

def get_quarter_dates(year, quarter):
    quarter_map = {
        "Q1": (date(year, 1, 1), date(year, 3, 31)),
        "Q2": (date(year, 4, 1), date(year, 6, 30)),
        "Q3": (date(year, 7, 1), date(year, 9, 30)),
        "Q4": (date(year, 10, 1), date(year, 12, 31)),
    }
    return quarter_map[quarter]

def get_current_quarter(today):
    month = today.month

    if month <= 3:
        return "Q1"
    elif month <= 6:
        return "Q2"
    elif month <= 9:
        return "Q3"
    return "Q4"

def get_default_cycle(available_cycles):
    today = date.today()
    current_quarter = get_current_quarter(today)

    if current_quarter in available_cycles:
        return current_quarter
    elif "Q2" in available_cycles:
        return "Q2"
    else:
        return available_cycles[0]
