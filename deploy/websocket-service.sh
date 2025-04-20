#!/bin/bash
# WebSocket服务管理脚本
# 用于在宝塔面板上启动、停止和重启WebSocket服务

# 配置
WS_DIR="/www/wwwroot/techvault.club"
WS_SCRIPT="websocket-server.js"
PID_FILE="${WS_DIR}/websocket.pid"
LOG_FILE="${WS_DIR}/logs/websocket.log"
NOHUP_OUT="${WS_DIR}/logs/nohup.out"

# 创建日志目录
mkdir -p "${WS_DIR}/logs"

# 函数: 启动WebSocket服务
start_service() {
    echo "正在启动WebSocket服务..."
    
    # 检查服务是否已经在运行
    if [ -f "${PID_FILE}" ] && ps -p $(cat "${PID_FILE}") > /dev/null 2>&1; then
        echo "WebSocket服务已经在运行中!"
        return 1
    fi
    
    # 启动服务
    cd "${WS_DIR}"
    nohup node "${WS_SCRIPT}" > "${NOHUP_OUT}" 2>&1 & 
    echo $! > "${PID_FILE}"
    
    # 检查是否成功启动
    sleep 2
    if [ -f "${PID_FILE}" ] && ps -p $(cat "${PID_FILE}") > /dev/null 2>&1; then
        echo "WebSocket服务已成功启动! PID: $(cat ${PID_FILE})"
        echo "$(date) - WebSocket服务已启动，PID: $(cat ${PID_FILE})" >> "${LOG_FILE}"
        return 0
    else
        echo "启动WebSocket服务失败!"
        rm -f "${PID_FILE}" 2>/dev/null
        return 1
    fi
}

# 函数: 停止WebSocket服务
stop_service() {
    echo "正在停止WebSocket服务..."
    
    # 检查服务是否在运行
    if [ ! -f "${PID_FILE}" ]; then
        echo "WebSocket服务未在运行!"
        return 1
    fi
    
    PID=$(cat "${PID_FILE}")
    if ! ps -p "${PID}" > /dev/null 2>&1; then
        echo "WebSocket服务未在运行，但PID文件存在。正在清理..."
        rm -f "${PID_FILE}"
        return 1
    fi
    
    # 停止服务
    echo "正在停止PID为${PID}的WebSocket服务..."
    kill "${PID}"
    
    # 检查是否成功停止
    sleep 2
    if ! ps -p "${PID}" > /dev/null 2>&1; then
        echo "WebSocket服务已成功停止!"
        echo "$(date) - WebSocket服务已停止，PID: ${PID}" >> "${LOG_FILE}"
        rm -f "${PID_FILE}"
        return 0
    else
        echo "正在强制终止WebSocket服务..."
        kill -9 "${PID}" 2>/dev/null
        sleep 1
        rm -f "${PID_FILE}"
        echo "WebSocket服务已强制停止!"
        echo "$(date) - WebSocket服务已强制停止，PID: ${PID}" >> "${LOG_FILE}"
        return 0
    fi
}

# 函数: 重启WebSocket服务
restart_service() {
    echo "正在重启WebSocket服务..."
    stop_service
    sleep 2
    start_service
}

# 函数: 检查WebSocket服务状态
status_service() {
    if [ -f "${PID_FILE}" ] && ps -p $(cat "${PID_FILE}") > /dev/null 2>&1; then
        PID=$(cat "${PID_FILE}")
        echo "WebSocket服务状态: 运行中 (PID: ${PID})"
        return 0
    else
        echo "WebSocket服务状态: 已停止"
        # 清理可能存在的过时PID文件
        rm -f "${PID_FILE}" 2>/dev/null
        return 1
    fi
}

# 函数: 查看WebSocket服务日志
view_logs() {
    if [ -f "${LOG_FILE}" ]; then
        echo "WebSocket服务日志:"
        tail -n 50 "${LOG_FILE}"
    else
        echo "日志文件不存在!"
    fi
}

# 主逻辑
case "$1" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        restart_service
        ;;
    status)
        status_service
        ;;
    logs)
        view_logs
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac

exit 0
