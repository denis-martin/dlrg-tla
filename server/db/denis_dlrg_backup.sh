#!/bin/bash

DATE=`date +%Y-%m-%d_%H%M`

mysqldump --no-create-db --no-create-info denis_dlrg_tla |gzip - >/home/denis/backup/dlrg_tla/${DATE}_denis_dlrg_tla-data.sql.gz
