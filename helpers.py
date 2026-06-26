from datetime import datetime
import random
import string


def generate_receipt_no() -> str:
    now = datetime.now()
    rand = ''.join(random.choices(string.digits, k=4))
    return f"FORC-{now.strftime('%Y%m%d')}-{rand}"


def generate_student_id(seq: int) -> str:
    now = datetime.now()
    return f"FO{now.strftime('%y')}{str(seq).zfill(4)}"
