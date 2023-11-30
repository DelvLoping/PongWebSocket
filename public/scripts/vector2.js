export class Vector2 {

  static add(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1]]; 
  }
  static subtract(v1, v2) {
    return [v1[0] - v2[0], v1[1] - v2[1]]; 
  }
  static multiply(v, scalar) {
    return [v[0]*scalar, v[1]*scalar]; 
  }
  static divide(v, scalar) {
    return [v[0]/scalar, v[1]/scalar]; 
  }
  static length(v) {
    return Math.sqrt(v[0]* v[0] + v[1]*v[1])
  }
  static normalize(v) {
    const l = Vector2.length(v);
    return Vector2.divide(v, l);
  }
  static dot(v1, v2) {
    return [v1[0] * v2[0] + v1[1] * v2[1]];
  }

  static rotate(dir, angle) {
    let theta = Math.atan(dir[1] / dir[0]);
    let degrees = theta * (180.0 / Math.PI);
    degrees += angle;
    theta = degrees * (Math.PI / 180.0);
    return [ Math.cos(theta), Math.sin(theta) ]
  }

}