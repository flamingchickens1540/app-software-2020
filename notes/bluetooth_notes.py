# Written By Liam Wang and Dylan Smith
​
import time, json, logging, threading
​
from watchdog.observers import Observer
from watchdog.events import *
import bluetooth.msbt as bluetooth
​​
def set_interval(func, sec):
    def func_wrapper():
        set_interval(func, sec)
        func()
    t = threading.Timer(sec, func_wrapper)
    t.start()
    return t
​
def check_for_addrs():
    print("Checking for devices...")
    nearby_devices = bluetooth.discover_devices(lookup_names=True)
    file = open("./bluetooth.json", "r+")
    data = json.loads(file.read())
    data["possible_addrs"] = nearby_devices
    file.seek(0)
    file.write(json.dumps(data))
    file.truncate()
    file.close()
    print(nearby_devices)
    print("Done with check")
​
set_interval(check_for_addrs, 50)
​
class NewEventHandler(FileSystemEventHandler):
    def on_any_event(self,event):
        if not event.is_directory and event.event_type == "modified" or event.event_type == "created":
            file = open(event.src_path, "r")
            message = file.read()
            if not len(message) == 0 and message[0] == "{" and "info" in json.loads(message):
                bluetoothFile = open("./bluetooth.json", "r")
                bluetoothJSON = json.loads(bluetoothFile.read())
​
                uuid = bluetoothJSON["uuid"]
                addr = bluetoothJSON["target_addr"]
​
                bluetoothFile.close()

                service_matches = bluetooth.find_service(address=addr, uuid=uuid)

                if len(service_matches) == 0:
                    addr = None
                    service_matches = bluetooth.find_service(uuid=uuid, address=addr)
                    if len(service_matches) == 0:
                        raise ValueError('Server not found! Make sure address and uuid of the server match, and that the server is running!')
​
                first_match = service_matches[0]

                port = first_match["port"]
                host = first_match["host"]
​
                # Create the client socket
                sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
                sock.connect((host, port))
​
                sock.send(message)
                time.sleep(.1)
                sock.send("end")
​
                sock.close()
​
if __name__ == "__main__":
    pass
    logging.basicConfig(level=logging.INFO,
                        format='%(asctime)s - %(message)s',
                        datefmt='%Y-%m-%d %H:%M:%S')
    event_handler = NewEventHandler()
    observer = Observer()
    observer.schedule(event_handler, "./data", recursive=True)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
