from es import Scraper
import configparser
import re
import os
import datetime

config = configparser.ConfigParser()
config.read('webmap.ini')

def create_bubble_contents(jobs):
    data = ''
    for job in jobs:
        data += f'  `<div class = "client">{job.client}</div>\n' + \
                f'  <div class = "address">{job.appointment.address}</div>\n' + \
                f'  <div class = "agent"> {job.agent.name}</div>\n' + \
                f'  <div class = "time" >{job.appointment.display_date} @ {job.appointment.display_time}</div>`,\n'
    data = 'const BUBBLE_CONTENTS = [\n  ' + data.strip().strip(',') + '\n]\n'
    return data


def create_postcodes(jobs):
    data = ''
    for job in jobs:
        data += f"  {{ 'postcode': '{job.appointment.postcode}' }},\n"
    data = 'const POSTCODES = [\n  ' + data.strip().strip(',') + '\n]\n'
    return data


def create_day_colors(jobs):
    data = ''
    config = configparser.ConfigParser()
    config.read('webmap.ini')
    for job in jobs:
        data += f"'  {config['COLORS'][job.map_color]}',\n"
    data = 'const DAY_COLORS = [\n  ' + data.strip().strip(',') + '\n]\n'
    return data


def create_legend(jobs):
    data = ''

    used_colors = []
    for job in jobs:
        if config["COLORS"][job.map_color] not in used_colors:
            used_colors.append(config["COLORS"][job.map_color])
            if not job.appointment.date:
                date = 'TBA'
            elif (job.appointment.date - datetime.datetime.now().date()).days > 14:
                date = '2wks+'
            else:
                date = job.appointment.display_date # [:4] + job.appointment.display_date[-2:]

            data += f'  <div>\n' + \
                    f'  <span class = "key" style="color:{config["COLORS"][job.map_color]}">●</span>\n' + \
                    f'  <span class = "legend">{date}</span>\n' + \
                    f'  </div>\n'
    data = 'const LEGEND_TEXT = [\n  `' + data.strip().strip(',') + '`\n]\n'
    return data


def inject_js(code, file_name=config['PATH']['JS_PATH']):
    code = 'start inject\n' + code + '// end inject\n'
    with open(file_name, 'r', encoding="utf8") as f:
        file_data = f.read()

    regex = r"start inject.*end inject"  # js file is // start inject {code...} // end inject
    matches = re.findall(regex, file_data, re.DOTALL)
    try:
        file_data = file_data.replace(matches[0], code)  # code format: start inject {code...} // end inject
    except IndexError as e:
        print('Unable to inject code:', e)

    with open(file_name, 'w', encoding="utf8") as f:
        f.write(file_data)


# initiate scraper to read data from websites and MS outlook (via excel spreadsheet)
scraper = Scraper(agent='KA', mode='headless')
# get jobs from key agent website
ka_web_jobs = scraper.get_ka_jobs()
# get jobs from MS outlook (via previously exported Excel spreadsheet)
outlook_jobs = scraper.get_outlook_jobs()
# remove duplicates from the lists giving priority to the outlook jobs
outlook_jobs, ka_web_jobs = scraper.remove_duplicates(outlook_jobs, ka_web_jobs)
# merge the lists
jobs = sorted(ka_web_jobs + outlook_jobs, key=lambda x: str(x.appointment.date))


inject_js(create_postcodes(jobs) + create_day_colors(jobs) + create_bubble_contents(jobs) + create_legend(jobs))

os.system('start '+config['PATH']['HTML_PATH']) # TODO remove file location hard coding
