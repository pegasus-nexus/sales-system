import requests
print(requests.get('https://sales-system-aptb.onrender.com/api/v1/fidelizacion/catalog').json()['productos'])
