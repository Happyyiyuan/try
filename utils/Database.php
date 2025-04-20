<?php

/**
 * Database connection and operation class.
 * Implemented as a singleton pattern, providing common CRUD operation methods
 * and using prepared statements to prevent SQL injection.
 */
class Database {
    /** @var Database|null Singleton instance */
    private static $instance = null;

    /** @var PDO Database connection object */
    private $connection;
    
    /** @var array 数据库配置信息 */
    private $config;

    /**
     * 私有构造函数，防止外部直接实例化
     */ 
    private function __construct() {
        $this->config = require __DIR__ . '/../config/database.php';
        $this->connect();
    }

    /**
     * 建立数据库连接
     * 
     * @throws Exception when the database connection fails
     */
    private function connect() {
        try {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=%s',
                $this->config['host'],
                $this->config['database'],
                $this->config['charset']
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => true, // 使用持久连接提高性能
            ]; 
            $this->connection = new PDO(
                $dsn,
                $this->config['username'],
                $this->config['password'],
                $options
            );
            
            // Set character set
            $this->connection->exec("SET NAMES {$this->config['charset']}");
        } catch (PDOException $e) {
            error_log('数据库连接错误: ' . $e->getMessage());
            throw new Exception('数据库连接失败: ' . $e->getMessage());
        }
    }

    /**
     * 获取数据库实例（单例模式）
     *
     * @return Database 返回数据库实例
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * 获取原始PDO连接对象
     *
     * @return PDO 返回PDO连接对象
     */
    public function getConnection() {
        return $this->connection;
    } 

    /**
     * 执行SQL查询
     * 
     * @param string $sql SQL语句
     * @param array $params 预处理参数数组
     * @return PDOStatement 返回PDOStatement对象
     * @throws Exception when the query execution fails
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log('SQL查询错误: ' . $e->getMessage() . ' SQL: ' . $sql);
            throw new Exception('查询执行失败: ' . $e->getMessage());
        }
    }

    /**
     * 获取单行结果
     *
     * @param string $sql SQL语句
     * @param array $params 预处理参数数组
     * @return array|false 返回结果数组或false
     */
    public function fetch($sql, $params = []) {
        return $this->query($sql, $params)->fetch();
    }

    /**
     * 获取多行结果
     *
     * @param string $sql SQL语句
     * @param array $params 预处理参数数组
     * @return array 返回结果数组
     */
    public function fetchAll($sql, $params = []) {
        return $this->query($sql, $params)->fetchAll();
    }
    
    /**
     * Fetch a single value from the database.
     *
     * @param string $sql The SQL query.
     * @param array $params The prepared statement parameters.
     * @param int $column The column index to fetch (default is 0).
     * @return mixed The value of the first column of the first row.
     */
    public function fetchColumn($sql, $params = [], $column = 0) {
        return $this->query($sql, $params)->fetchColumn($column);
    }

    /**
     * Insert data into a table.
     *
     * @param string $table The table name.
     * @param array $data An associative array of data to insert.
     * @return string The ID of the last inserted row.
     */
    public function insert($table, $data) {
        if (empty($data)) { 
            throw new Exception('插入数据不能为空');
        }
        
        $fields = array_keys($data);
        $values = array_fill(0, count($fields), '?');
        
        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s)',
            $table,
            implode(', ', $fields),
            implode(', ', $values)
        );

        $this->query($sql, array_values($data));
        return $this->connection->lastInsertId();
    }

    /**
     * Update data in a table.
     *
     * @param string $table The table name.
     * @param array $data An associative array of data to update.
     * @param string $where The WHERE clause.
     * @param array $whereParams WHERE条件参数数组
     * @return int 返回受影响的行数
     */
    public function update($table, $data, $where, $whereParams = []) {
        if (empty($data)) {
            throw new Exception('更新数据不能为空');
        }
        
        $fields = array_map(function($field) {
            return $field . ' = ?';
        }, array_keys($data));

        $sql = sprintf(
            'UPDATE %s SET %s WHERE %s',
            $table,
            implode(', ', $fields),
            $where
        );

        $params = array_merge(array_values($data), $whereParams);
        return $this->query($sql, $params)->rowCount();
    }

    /**
     * Delete data from a table.
     *
     * @param string $table The table name.
     * @param string $where The WHERE clause.
     * @param array $params WHERE条件参数数组
     * @return int 返回受影响的行数
     */
    public function delete($table, $where, $params = []) {
        if (empty($where)) {
            throw new Exception('删除操作必须指定WHERE条件');
        }
        
        $sql = sprintf('DELETE FROM %s WHERE %s', $table, $where);
        return $this->query($sql, $params)->rowCount();
    }
    
    /**
     * Start a transaction.
     *
     * @return bool True on success, false on failure.
     */
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }
    
    /**
     * Commit the current transaction.
     *
     * @return bool True on success, false on failure.
     */
    public function commit() {
        return $this->connection->commit();
    }
    
    /**
     * Roll back the current transaction.
     *
     * @return bool True on success, false on failure.
     */
    public function rollBack() {
        return $this->connection->rollBack();
    }
    
    /**
     * 检查是否在事务中
     * 
     * @return bool True if currently in a transaction, false otherwise.
     */
    public function inTransaction() {
        return $this->connection->inTransaction();
    }
}